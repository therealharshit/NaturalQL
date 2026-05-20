import { describe, expect, it } from "vitest";
import { validateReadOnlySql } from "./validate-readonly";

describe("validateReadOnlySql", () => {
  it("accepts a single SELECT query and adds a limit", async () => {
    const result = await validateReadOnlySql("select id, email from users", 100);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedSql).toBe("select id, email from users LIMIT 100");
      expect(result.tablesReferenced).toEqual(["users"]);
    }
  });

  it("preserves existing limits", async () => {
    const result = await validateReadOnlySql("select * from users limit 10", 100);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedSql).toBe("select * from users limit 10");
    }
  });

  it("rejects mutation statements", async () => {
    const result = await validateReadOnlySql("delete from users");

    expect(result).toEqual({
      ok: false,
      reason: "Only read-only SELECT queries are allowed.",
    });
  });

  it("rejects multi-statement SQL", async () => {
    const result = await validateReadOnlySql("select * from users; select * from accounts");

    expect(result).toEqual({
      ok: false,
      reason: "Only one SQL statement is allowed.",
    });
  });

  it("rejects unsafe functions", async () => {
    const result = await validateReadOnlySql("select pg_sleep(10)");

    expect(result).toEqual({
      ok: false,
      reason: "Function pg_sleep is not allowed in read-only queries.",
    });
  });

  it("rejects invalid SQL without throwing", async () => {
    const result = await validateReadOnlySql("select from");

    expect(result).toEqual({
      ok: false,
      reason: "SQL could not be parsed as Postgres.",
    });
  });
});
