import { draftQuery } from "@/lib/ai/draft-query";
import { validateReadOnlySql } from "@/lib/sql/validate-readonly";
import { ApiResponse, QueryDraft, SchemaSnapshotSchema } from "@/lib/types/query";
import { z } from "zod";

const DraftRequestSchema = z.object({
  question: z.string().min(1),
  schema: SchemaSnapshotSchema,
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = DraftRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Ask a question after connecting a database schema.",
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  try {
    const draft = await draftQuery(parsed.data);
    const validation =
      draft.sql && !draft.needsClarification
        ? await validateReadOnlySql(draft.sql)
        : undefined;

    return Response.json({
      ok: true,
      draft,
      validation,
    } satisfies ApiResponse<{
      draft: QueryDraft;
      validation?: Awaited<ReturnType<typeof validateReadOnlySql>>;
    }>);
  } catch (error) {
    const isMissingKey =
      error instanceof Error && error.message.includes("OPENAI_API_KEY");

    return Response.json(
      {
        ok: false,
        code: isMissingKey ? "AI_NOT_CONFIGURED" : "AI_DRAFT_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Could not draft SQL for this question.",
      } satisfies ApiResponse<never>,
      { status: isMissingKey ? 503 : 502 },
    );
  }
}
