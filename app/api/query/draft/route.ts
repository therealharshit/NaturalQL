import { DraftRequestSchema } from "@/lib/types/query";
import type { ApiResponse, QueryDraft } from "@/lib/types/query";
import { draftQuery } from "@/lib/ai/draft-query";
import { validateReadOnlySql } from "@/lib/sql/validate-readonly";

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

  const parsed = DraftRequestSchema.safeParse(body);
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

  const { connection, question, schema } = parsed.data;

  /* Draft SQL via AI */
  let draft: QueryDraft;
  try {
    draft = await draftQuery({
      question,
      schema,
      dbType: connection.type,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = msg.includes("GEMINI_API_KEY")
      ? "AI_NOT_CONFIGURED"
      : "AI_DRAFT_FAILED";
    return Response.json(
      {
        ok: false,
        code,
        message: `AI draft failed: ${msg}`,
      } satisfies ApiResponse<never>,
      { status: code === "AI_NOT_CONFIGURED" ? 503 : 502 },
    );
  }

  /* If clarification needed, return draft without validation */
  if (draft.needsClarification || !draft.sql) {
    return Response.json({
      ok: true,
      draft,
      safeSql: null,
      validationError: null,
    } satisfies ApiResponse<{
      draft: QueryDraft;
      safeSql: string | null;
      validationError: string | null;
    }>);
  }

  /* Validate generated SQL */
  const validation = await validateReadOnlySql(draft.sql, connection.type);

  if (!validation.valid) {
    return Response.json({
      ok: true,
      draft,
      safeSql: null,
      validationError: validation.error,
    } satisfies ApiResponse<{
      draft: QueryDraft;
      safeSql: string | null;
      validationError: string | null;
    }>);
  }

  return Response.json({
    ok: true,
    draft,
    safeSql: validation.normalizedSql,
    validationError: null,
  } satisfies ApiResponse<{
    draft: QueryDraft;
    safeSql: string | null;
    validationError: string | null;
  }>);
}
