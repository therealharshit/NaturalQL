import type { DbType } from "@/lib/types/query";

export type ValidationResult =
  | { valid: true; normalizedSql: string; tablesReferenced: string[] }
  | { valid: false; error: string };

const MAX_ROWS = 100;

/** Unsafe Postgres functions that should never appear in user queries. */
const UNSAFE_PG_FUNCTIONS = [
  "pg_sleep",
  "pg_terminate_backend",
  "pg_cancel_backend",
  "pg_advisory_lock",
  "pg_advisory_unlock",
  "pg_advisory_xact_lock",
  "dblink",
  "dblink_exec",
  "lo_import",
  "lo_export",
];

/** Statement prefixes that indicate write/DDL operations. */
const WRITE_PREFIXES = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "REPLACE",
  "MERGE",
  "CALL",
  "EXEC",
  "EXECUTE",
  "SET",
  "LOCK",
  "UNLOCK",
  "RENAME",
  "LOAD",
  "COPY",
  "VACUUM",
  "ANALYZE",
  "REINDEX",
  "CLUSTER",
  "COMMENT",
  "REASSIGN",
];

/**
 * Validate that a SQL string is read-only.
 * For PostgreSQL, uses pgsql-parser for AST-level validation.
 * For MySQL/SQLite, uses keyword-based validation.
 */
export async function validateReadOnlySql(
  sql: string,
  dbType: DbType,
): Promise<ValidationResult> {
  const trimmed = sql.trim();

  if (!trimmed) {
    return { valid: false, error: "SQL is empty." };
  }

  /* Reject multiple statements (semicolons between words) */
  const statements = splitStatements(trimmed);
  if (statements.length > 1) {
    return { valid: false, error: "Multiple statements are not allowed." };
  }

  if (dbType === "postgresql") {
    return validatePostgres(trimmed);
  }

  return validateGeneric(trimmed, dbType);
}

/**
 * PostgreSQL: parse with pgsql-parser for deep AST validation.
 */
async function validatePostgres(sql: string): Promise<ValidationResult> {
  let parser: typeof import("pgsql-parser");
  try {
    parser = await import("pgsql-parser");
  } catch {
    /* Fallback to generic if parser unavailable */
    return validateGeneric(sql, "postgresql");
  }

  /* parse() is async and returns { version, stmts: [{ stmt: { SelectStmt: ... } }] } */
  let parsed: { stmts: Array<{ stmt: Record<string, unknown> }> };
  try {
    parsed = await parser.parse(sql);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { valid: false, error: `SQL parse error: ${msg}` };
  }

  const stmts = parsed?.stmts;
  if (!stmts || stmts.length === 0) {
    return { valid: false, error: "No statements found." };
  }

  if (stmts.length > 1) {
    return { valid: false, error: "Multiple statements are not allowed." };
  }

  const stmtWrapper = stmts[0];
  const inner = stmtWrapper?.stmt;

  if (!inner || typeof inner !== "object") {
    return { valid: false, error: "Unrecognised statement structure." };
  }

  const stmtType = Object.keys(inner)[0];
  if (stmtType !== "SelectStmt") {
    return {
      valid: false,
      error: `Only SELECT statements are allowed. Found: ${stmtType}`,
    };
  }

  /* Check for SELECT INTO */
  const selectStmt = inner.SelectStmt as Record<string, unknown>;
  if (selectStmt?.intoClause) {
    return { valid: false, error: "SELECT INTO is not allowed." };
  }

  /* Stringify and check for unsafe functions */
  const sqlLower = sql.toLowerCase();
  for (const fn of UNSAFE_PG_FUNCTIONS) {
    if (sqlLower.includes(fn)) {
      return { valid: false, error: `Unsafe function "${fn}" is not allowed.` };
    }
  }

  /* Extract referenced tables */
  const tablesReferenced = extractTablesFromAst(selectStmt);

  /* Append LIMIT if absent */
  const normalizedSql = ensureLimit(sql);

  return { valid: true, normalizedSql, tablesReferenced };
}

/**
 * Generic keyword-based validation for MySQL and SQLite.
 */
function validateGeneric(
  sql: string,
  dbType: DbType,
): ValidationResult {
  const upper = sql.trim().toUpperCase();
  const firstWord = upper.split(/\s+/)[0];

  if (!firstWord || firstWord !== "SELECT") {
    if (WRITE_PREFIXES.includes(firstWord || "")) {
      return {
        valid: false,
        error: `Only SELECT statements are allowed. Found: ${firstWord}`,
      };
    }
    /* Also allow WITH (CTEs) */
    if (firstWord !== "WITH") {
      return {
        valid: false,
        error: `Only SELECT statements are allowed. Found: ${firstWord}`,
      };
    }
  }

  /* Check for write keywords embedded in the query (e.g. subquery with INSERT) */
  const dangerPattern =
    /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|DROP\s|ALTER\s|CREATE\s|TRUNCATE\s)/i;
  if (dangerPattern.test(sql)) {
    return {
      valid: false,
      error: "Write operations are not allowed inside queries.",
    };
  }

  /* Check SELECT INTO */
  if (/\bSELECT\b.*\bINTO\b/i.test(sql)) {
    return { valid: false, error: "SELECT INTO is not allowed." };
  }

  /* Check unsafe functions for PG */
  if (dbType === "postgresql") {
    const sqlLower = sql.toLowerCase();
    for (const fn of UNSAFE_PG_FUNCTIONS) {
      if (sqlLower.includes(fn)) {
        return {
          valid: false,
          error: `Unsafe function "${fn}" is not allowed.`,
        };
      }
    }
  }

  /* Extract table names (best-effort from FROM / JOIN clauses) */
  const tablesReferenced = extractTablesFromSql(sql);

  /* Append LIMIT if absent */
  const normalizedSql = ensureLimit(sql, dbType);

  return { valid: true, normalizedSql, tablesReferenced };
}

/**
 * Split on semicolons that aren't inside quotes.
 */
function splitStatements(sql: string): string[] {
  const results: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const prev = i > 0 ? sql[i - 1] : "";

    if (ch === "'" && !inDouble && prev !== "\\") inSingle = !inSingle;
    if (ch === '"' && !inSingle && prev !== "\\") inDouble = !inDouble;

    if (ch === ";" && !inSingle && !inDouble) {
      const trimmed = current.trim();
      if (trimmed) results.push(trimmed);
      current = "";
    } else {
      current += ch;
    }
  }

  const trimmed = current.trim();
  if (trimmed) results.push(trimmed);

  return results;
}

/**
 * Ensure the query has a LIMIT clause. Append one if missing.
 */
function ensureLimit(sql: string, dbType?: DbType): string {
  const upper = sql.toUpperCase();
  if (/\bLIMIT\s+\d+/i.test(upper)) {
    return sql;
  }
  /* Strip trailing semicolon before appending */
  const clean = sql.replace(/;\s*$/, "");
  return `${clean} LIMIT ${MAX_ROWS}`;
}

/**
 * Best-effort table extraction from pgsql-parser AST.
 */
function extractTablesFromAst(
  node: Record<string, unknown>,
): string[] {
  const tables: Set<string> = new Set();

  function walk(obj: unknown): void {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }

    const record = obj as Record<string, unknown>;

    /* RangeVar nodes represent table references */
    if (record.RangeVar) {
      const rv = record.RangeVar as Record<string, unknown>;
      const name = rv.relname as string | undefined;
      if (name) {
        const schema = rv.schemaname as string | undefined;
        tables.add(schema ? `${schema}.${name}` : name);
      }
    }

    for (const val of Object.values(record)) {
      walk(val);
    }
  }

  walk(node);
  return Array.from(tables);
}

/**
 * Best-effort table extraction from SQL string using FROM/JOIN patterns.
 */
function extractTablesFromSql(sql: string): string[] {
  const tables: Set<string> = new Set();
  const pattern = /\b(?:FROM|JOIN)\s+`?(\w+)`?/gi;
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    if (match[1]) {
      tables.add(match[1]);
    }
  }
  return Array.from(tables);
}
