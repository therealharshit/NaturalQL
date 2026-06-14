import type { DbConnection } from "@/lib/types/query";
import type { DbAdapter } from "./types";
import { PostgresAdapter } from "./postgres";
import { MysqlAdapter } from "./mysql";
import { SqliteAdapter } from "./sqlite";

/**
 * Factory: create the right adapter for the given connection config.
 */
export function createAdapter(connection: DbConnection): DbAdapter {
  switch (connection.type) {
    case "postgresql":
      return new PostgresAdapter({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: connection.database,
      });

    case "mysql":
      return new MysqlAdapter({
        host: connection.host,
        port: connection.port,
        user: connection.user,
        password: connection.password,
        database: connection.database,
      });

    case "sqlite":
      return new SqliteAdapter({
        filepath: connection.filepath,
      });

    default: {
      const _exhaustive: never = connection;
      throw new Error(`Unsupported database type: ${(_exhaustive as DbConnection).type}`);
    }
  }
}

export type { DbAdapter } from "./types";
