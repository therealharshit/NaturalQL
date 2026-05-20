import { describe, expect, it } from "vitest";
import { QueryDraftSchema } from "../types/query";

describe("QueryDraftSchema", () => {
  it("accepts structured SQL draft output", () => {
    const result = QueryDraftSchema.safeParse({
      needsClarification: false,
      clarifyingQuestion: null,
      sql: "select * from users limit 10",
      tablesReferenced: ["users"],
      assumptions: ["Revenue is based on invoices."],
      caveats: ["Refunds are not represented in this schema."],
      confidence: 0.82,
      explanationPlan: "Summarize the top users by invoice totals.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed draft output", () => {
    const result = QueryDraftSchema.safeParse({
      sql: "select * from users",
    });

    expect(result.success).toBe(false);
  });
});
