import { Client } from "pg";
import type { DbAdapter } from "./types";
import type { SchemaSnapshot, QueryResult, TableSchema } from "@/lib/types/query";

const MAX_ROWS = 100;

type PgConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export class PostgresAdapter implements DbAdapter {
  private client: Client;
  private config: PgConnectionConfig;

  constructor(config: PgConnectionConfig) {
    this.config = config;
    this.client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 30_000,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async introspect(): Promise<SchemaSnapshot> {
    /* Get all user tables (exclude system schemas) */
    const tablesResult = await this.client.query<{
      table_schema: string;
      table_name: string;
    }>(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
         AND table_type = 'BASE TABLE'
       ORDER BY table_schema, table_name`,
    );

    const tables: TableSchema[] = [];

    for (const row of tablesResult.rows) {
      const colResult = await this.client.query<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [row.table_schema, row.table_name],
      );

      const name =
        row.table_schema === "public"
          ? row.table_name
          : `${row.table_schema}.${row.table_name}`;

      tables.push({
        name,
        columns: colResult.rows.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === "YES",
        })),
      });
    }

    return {
      tables,
      generatedAt: new Date().toISOString(),
    };
  }

  async execute(sql: string): Promise<QueryResult> {
    const result = await this.client.query(sql);

    const rows = result.rows ?? [];
    const columns = result.fields?.map((f) => f.name) ?? [];
    const truncated = rows.length >= MAX_ROWS;

    return {
      columns,
      rows: rows.slice(0, MAX_ROWS),
      rowCount: rows.length,
      truncated,
    };
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }
}
