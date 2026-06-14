import type { SchemaSnapshot, QueryResult } from "@/lib/types/query";

/**
 * Unified database adapter interface.
 * Each driver (postgres, mysql, sqlite) implements this.
 */
export interface DbAdapter {
  /** Test connection and return once ready. */
  connect(): Promise<void>;

  /** Introspect the database schema: tables + columns. */
  introspect(): Promise<SchemaSnapshot>;

  /** Execute a validated read-only SQL query. */
  execute(sql: string): Promise<QueryResult>;

  /** Close the connection. */
  disconnect(): Promise<void>;
}
