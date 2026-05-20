import { inspectMcpServer, loadSchemaSnapshot } from "@/lib/mcp/tools";
import { validateRemoteMcpEndpoint } from "@/lib/mcp/validate-endpoint";
import { ApiResponse, McpConnectionSchema, SchemaSnapshot } from "@/lib/types/query";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = McpConnectionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Enter a valid MCP endpoint and optional bearer token.",
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  const endpointValidation = await validateRemoteMcpEndpoint(parsed.data.endpoint);
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

  try {
    const [inspection, schema] = await Promise.all([
      inspectMcpServer(parsed.data),
      loadSchemaSnapshot(parsed.data),
    ]);

    return Response.json({
      ok: true,
      tools: inspection.tools,
      selectedTools: inspection.selectedTools,
      schema,
    } satisfies ApiResponse<{
      tools: Array<{ name: string; description?: string }>;
      selectedTools: Record<string, string | undefined>;
      schema: SchemaSnapshot;
    }>);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        code: "MCP_CONNECTION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Could not connect to the MCP server.",
      } satisfies ApiResponse<never>,
      { status: 502 },
    );
  }
}
