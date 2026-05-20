import { describe, expect, it } from "vitest";
import { ResultExplanationSchema } from "../types/query";

describe("ResultExplanationSchema", () => {
  it("accepts structured result explanations", () => {
    const result = ResultExplanationSchema.safeParse({
      summary: "Acme had the highest revenue last month.",
      findings: ["Acme generated $12,000.", "The top five customers total $31,000."],
      caveats: ["Refunds were not present in the returned rows."],
    });

    expect(result.success).toBe(true);
  });

  it("rejects unstructured explanations", () => {
    const result = ResultExplanationSchema.safeParse("Looks good");

    expect(result.success).toBe(false);
  });
});
