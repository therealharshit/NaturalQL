import mysql from "mysql2/promise";
import type { DbAdapter } from "./types";
import type { SchemaSnapshot, QueryResult, TableSchema } from "@/lib/types/query";

const MAX_ROWS = 100;

type MysqlConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export class MysqlAdapter implements DbAdapter {
  private connection: mysql.Connection | null = null;
  private config: MysqlConnectionConfig;

  constructor(config: MysqlConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      connectTimeout: 10_000,
    });
  }

  async introspect(): Promise<SchemaSnapshot> {
    const conn = this.getConnection();

    const [tableRows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = ?
         AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [this.config.database],
    );

    const tables: TableSchema[] = [];

    for (const row of tableRows) {
      const [colRows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = ? AND table_name = ?
         ORDER BY ordinal_position`,
        [this.config.database, row.table_name],
      );

      tables.push({
        name: row.table_name as string,
        columns: colRows.map((col) => ({
          name: col.column_name as string,
          type: col.data_type as string,
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
    const conn = this.getConnection();
    const [rows, fields] = await conn.query<mysql.RowDataPacket[]>(sql);

    const columns = fields
      ? (fields as mysql.FieldPacket[]).map((f) => f.name)
      : [];
    const truncated = rows.length >= MAX_ROWS;

    return {
      columns,
      rows: rows.slice(0, MAX_ROWS) as Record<string, unknown>[],
      rowCount: rows.length,
      truncated,
    };
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  private getConnection(): mysql.Connection {
    if (!this.connection) {
      throw new Error("Not connected. Call connect() first.");
    }
    return this.connection;
  }
}
