import Database from "better-sqlite3";
import type { DbAdapter } from "./types";
import type { SchemaSnapshot, QueryResult, TableSchema } from "@/lib/types/query";

const MAX_ROWS = 100;

type SqliteConnectionConfig = {
  filepath: string;
};

export class SqliteAdapter implements DbAdapter {
  private db: Database.Database | null = null;
  private config: SqliteConnectionConfig;

  constructor(config: SqliteConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.db = new Database(this.config.filepath, { readonly: true });
  }

  async introspect(): Promise<SchemaSnapshot> {
    const db = this.getDb();

    /* Get all user tables */
    const tableRows = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      )
      .all() as Array<{ name: string }>;

    const tables: TableSchema[] = [];

    for (const row of tableRows) {
      const colRows = db.prepare(`PRAGMA table_info("${row.name}")`).all() as Array<{
        name: string;
        type: string;
        notnull: number;
      }>;

      tables.push({
        name: row.name,
        columns: colRows.map((col) => ({
          name: col.name,
          type: col.type,
          nullable: col.notnull === 0,
        })),
      });
    }

    return {
      tables,
      generatedAt: new Date().toISOString(),
    };
  }

  async execute(sql: string): Promise<QueryResult> {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    const rows = stmt.all() as Record<string, unknown>[];

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const truncated = rows.length >= MAX_ROWS;

    return {
      columns,
      rows: rows.slice(0, MAX_ROWS),
      rowCount: rows.length,
      truncated,
    };
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDb(): Database.Database {
    if (!this.db) {
      throw new Error("Not connected. Call connect() first.");
    }
    return this.db;
  }
}
