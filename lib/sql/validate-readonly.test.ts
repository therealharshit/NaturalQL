import { describe, it, expect } from "vitest";
import { validateReadOnlySql } from "./validate-readonly";
import type { DbType } from "@/lib/types/query";

const DB_TYPES: DbType[] = ["postgresql", "mysql", "sqlite"];

describe("validateReadOnlySql", () => {
  describe("valid SELECT statements", () => {
    const validQueries = [
      "SELECT * FROM users",
      "SELECT id, name FROM users WHERE active = true",
      "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id",
      "SELECT COUNT(*) FROM products",
      "SELECT * FROM users LIMIT 10",
    ];

    for (const sql of validQueries) {
      for (const dbType of DB_TYPES) {
        it(`accepts: ${sql} (${dbType})`, async () => {
          const result = await validateReadOnlySql(sql, dbType);
          expect(result.valid).toBe(true);
        });
      }
    }
  });

  describe("WITH (CTE) queries", () => {
    it("accepts WITH ... SELECT", async () => {
      const sql =
        "WITH active AS (SELECT * FROM users WHERE active = true) SELECT * FROM active";
      const result = await validateReadOnlySql(sql, "postgresql");
      expect(result.valid).toBe(true);
    });
  });

  describe("rejected write operations", () => {
    const writeQueries = [
      "INSERT INTO users (name) VALUES ('test')",
      "UPDATE users SET name = 'test'",
      "DELETE FROM users WHERE id = 1",
      "DROP TABLE users",
      "ALTER TABLE users ADD COLUMN age INT",
      "CREATE TABLE test (id INT)",
      "TRUNCATE TABLE users",
    ];

    for (const sql of writeQueries) {
      for (const dbType of DB_TYPES) {
        it(`rejects: ${sql.substring(0, 30)}... (${dbType})`, async () => {
          const result = await validateReadOnlySql(sql, dbType);
          expect(result.valid).toBe(false);
        });
      }
    }
  });

  describe("multiple statements", () => {
    it("rejects queries with semicolons between statements", async () => {
      const sql = "SELECT 1; SELECT 2";
      const result = await validateReadOnlySql(sql, "postgresql");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("Multiple statements");
      }
    });
  });

  describe("empty SQL", () => {
    it("rejects empty string", async () => {
      const result = await validateReadOnlySql("", "postgresql");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("empty");
      }
    });

    it("rejects whitespace-only", async () => {
      const result = await validateReadOnlySql("   ", "mysql");
      expect(result.valid).toBe(false);
    });
  });

  describe("SELECT INTO rejection", () => {
    it("rejects SELECT INTO", async () => {
      const sql = "SELECT * INTO new_table FROM users";
      for (const dbType of DB_TYPES) {
        const result = await validateReadOnlySql(sql, dbType);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toContain("SELECT INTO");
        }
      }
    });
  });

  describe("LIMIT injection", () => {
    it("appends LIMIT when absent", async () => {
      const sql = "SELECT * FROM users";
      const result = await validateReadOnlySql(sql, "mysql");
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.normalizedSql).toContain("LIMIT");
      }
    });

    it("preserves existing LIMIT", async () => {
      const sql = "SELECT * FROM users LIMIT 10";
      const result = await validateReadOnlySql(sql, "mysql");
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.normalizedSql).toContain("LIMIT 10");
        expect(result.normalizedSql).not.toContain("LIMIT 100");
      }
    });
  });

  describe("table extraction", () => {
    it("extracts table names from simple query", async () => {
      const sql = "SELECT * FROM users JOIN orders ON users.id = orders.user_id";
      const result = await validateReadOnlySql(sql, "mysql");
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.tablesReferenced).toContain("users");
        expect(result.tablesReferenced).toContain("orders");
      }
    });
  });

  describe("unsafe PostgreSQL functions", () => {
    it("rejects pg_sleep", async () => {
      const sql = "SELECT pg_sleep(10)";
      const result = await validateReadOnlySql(sql, "postgresql");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("pg_sleep");
      }
    });

    it("rejects dblink", async () => {
      const sql = "SELECT * FROM dblink('dbname=test', 'SELECT 1')";
      const result = await validateReadOnlySql(sql, "postgresql");
      expect(result.valid).toBe(false);
    });
  });
});
