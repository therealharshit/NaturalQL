import { parse } from "pgsql-parser";

export type SqlValidationResult =
  | {
      ok: true;
      normalizedSql: string;
      tablesReferenced: string[];
    }
  | {
      ok: false;
      reason: string;
    };

const UNSAFE_FUNCTIONS = new Set([
  "dblink",
  "dblink_exec",
  "lo_export",
  "pg_advisory_lock",
  "pg_advisory_xact_lock",
  "pg_sleep",
  "pg_terminate_backend",
]);

export async function validateReadOnlySql(
  sql: string,
  maxRows = 500,
): Promise<SqlValidationResult> {
  const trimmed = sql.trim().replace(/;+$/, "");

  if (!trimmed) {
    return { ok: false, reason: "SQL is empty." };
  }

  let statements: unknown[];
  try {
    const parsed = (await parse(trimmed)) as { stmts?: unknown[] };
    statements = parsed.stmts ?? [];
  } catch {
    return { ok: false, reason: "SQL could not be parsed as Postgres." };
  }

  if (statements.length !== 1) {
    return { ok: false, reason: "Only one SQL statement is allowed." };
  }

  const rawStatement = statements[0] as Record<string, unknown>;
  const statement = getNestedRecord(rawStatement, ["stmt"]);

  if (!statement || !("SelectStmt" in statement)) {
    return { ok: false, reason: "Only read-only SELECT queries are allowed." };
  }

  const selectStatement = (statement as { SelectStmt: Record<string, unknown> })
    .SelectStmt;

  if ("intoClause" in selectStatement) {
    return { ok: false, reason: "SELECT INTO is not allowed." };
  }

  const unsafeFunction = findUnsafeFunction(statement);
  if (unsafeFunction) {
    return {
      ok: false,
      reason: `Function ${unsafeFunction} is not allowed in read-only queries.`,
    };
  }

  const tablesReferenced = Array.from(findTables(statement)).sort();
  const normalizedSql = hasLimit(selectStatement)
    ? trimmed
    : `${trimmed} LIMIT ${maxRows}`;

  return { ok: true, normalizedSql, tablesReferenced };
}

function getNestedRecord(
  value: Record<string, unknown>,
  path: string[],
): Record<string, unknown> | undefined {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return isRecord(current) ? current : undefined;
}

function hasLimit(selectStatement: Record<string, unknown>): boolean {
  return "limitCount" in selectStatement;
}

function findUnsafeFunction(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findUnsafeFunction(item);
      if (result) return result;
    }
    return undefined;
  }

  if (!isRecord(value)) return undefined;

  if ("FuncCall" in value && isRecord(value.FuncCall)) {
    const funcname = value.FuncCall.funcname;
    const name = extractFunctionName(funcname);
    if (name && UNSAFE_FUNCTIONS.has(name.toLowerCase())) {
      return name;
    }
  }

  for (const child of Object.values(value)) {
    const result = findUnsafeFunction(child);
    if (result) return result;
  }

  return undefined;
}

function findTables(value: unknown, tables = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) findTables(item, tables);
    return tables;
  }

  if (!isRecord(value)) return tables;

  if ("RangeVar" in value && isRecord(value.RangeVar)) {
    const relname = value.RangeVar.relname;
    if (typeof relname === "string") tables.add(relname);
  }

  for (const child of Object.values(value)) {
    findTables(child, tables);
  }

  return tables;
}

function extractFunctionName(funcname: unknown): string | undefined {
  if (!Array.isArray(funcname)) return undefined;
  const parts = funcname
    .map((item) => {
      if (!isRecord(item) || !isRecord(item.String)) return undefined;
      return typeof item.String.sval === "string" ? item.String.sval : undefined;
    })
    .filter(Boolean);

  return parts.at(-1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
