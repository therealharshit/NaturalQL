import { ExecuteRequestSchema } from "@/lib/types/query";
import type {
  ApiResponse,
  QueryResult,
  ResultExplanation,
} from "@/lib/types/query";
import { createAdapter } from "@/lib/db";
import { validateReadOnlySql } from "@/lib/sql/validate-readonly";
import { explainResults } from "@/lib/ai/explain-results";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid JSON body.",
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  const parsed = ExecuteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid request parameters.",
        details: parsed.error.flatten(),
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  const { connection, sql, question } = parsed.data;

  /* Re-validate SQL at the enforcement point */
  const validation = await validateReadOnlySql(sql, connection.type);
  if (!validation.valid) {
    return Response.json(
      {
        ok: false,
        code: "UNSAFE_SQL",
        message: validation.error,
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  /* Execute the query */
  const adapter = createAdapter(connection);
  let result: QueryResult;

  try {
    await adapter.connect();
    result = await adapter.execute(validation.normalizedSql);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await adapter.disconnect().catch(() => {});
    return Response.json(
      {
        ok: false,
        code: "QUERY_FAILED",
        message: `Query execution failed: ${msg}`,
      } satisfies ApiResponse<never>,
      { status: 502 },
    );
  }

  await adapter.disconnect().catch(() => {});

  /* Explain results via AI (best-effort, don't fail the request) */
  let explanation: ResultExplanation = {
    summary: `Query returned ${result.rowCount} row${result.rowCount !== 1 ? "s" : ""}.`,
    findings: [],
    caveats: result.truncated ? ["Results were truncated to 100 rows."] : [],
  };

  try {
    explanation = await explainResults({
      question: question ?? sql,
      sql: validation.normalizedSql,
      result,
    });
  } catch {
    /* Use default explanation if AI fails */
  }

  return Response.json({
    ok: true,
    result,
    explanation,
    sql: validation.normalizedSql,
  } satisfies ApiResponse<{
    result: QueryResult;
    explanation: ResultExplanation;
    sql: string;
  }>);
}
