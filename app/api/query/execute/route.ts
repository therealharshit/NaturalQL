import { explainResults } from "@/lib/ai/explain-results";
import { executeReadOnlyQuery } from "@/lib/mcp/tools";
import { validateRemoteMcpEndpoint } from "@/lib/mcp/validate-endpoint";
import { validateReadOnlySql } from "@/lib/sql/validate-readonly";
import { ApiResponse, McpConnectionSchema, QueryResult } from "@/lib/types/query";
import { z } from "zod";

const ExecuteRequestSchema = z.object({
  connection: McpConnectionSchema,
  sql: z.string().min(1),
  question: z.string().min(1),
  caveats: z.array(z.string()).default([]),
  approved: z.literal(true),
  maxRows: z.number().int().min(1).max(1_000).default(500),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ExecuteRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Execution requires a connection, SQL, and explicit approval.",
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  const endpointValidation = await validateRemoteMcpEndpoint(
    parsed.data.connection.endpoint,
  );
  if (!endpointValidation.ok) {
    return Response.json(
      {
        ok: false,
        code: "UNSAFE_ENDPOINT",
        message: endpointValidation.reason,
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  const sqlValidation = await validateReadOnlySql(
    parsed.data.sql,
    parsed.data.maxRows,
  );
  if (!sqlValidation.ok) {
    return Response.json(
      {
        ok: false,
        code: "UNSAFE_SQL",
        message: sqlValidation.reason,
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  try {
    const result = await executeReadOnlyQuery(
      parsed.data.connection,
      sqlValidation.normalizedSql,
      parsed.data.maxRows,
    );
    const explanation = await explainResults({
      question: parsed.data.question,
      sql: sqlValidation.normalizedSql,
      result,
      caveats: parsed.data.caveats,
    });

    return Response.json({
      ok: true,
      sql: sqlValidation.normalizedSql,
      result,
      explanation,
      tablesReferenced: sqlValidation.tablesReferenced,
    } satisfies ApiResponse<{
      sql: string;
      result: QueryResult;
      explanation: Awaited<ReturnType<typeof explainResults>>;
      tablesReferenced: string[];
    }>);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        code: "QUERY_FAILED",
        message:
          error instanceof Error ? error.message : "The MCP query tool failed.",
      } satisfies ApiResponse<never>,
      { status: 502 },
    );
  }
}
