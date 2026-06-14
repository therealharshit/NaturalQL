import { ConnectRequestSchema } from "@/lib/types/query";
import type { ApiResponse, SchemaSnapshot } from "@/lib/types/query";
import { createAdapter } from "@/lib/db";

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

  const parsed = ConnectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid connection parameters.",
        details: parsed.error.flatten(),
      } satisfies ApiResponse<never>,
      { status: 400 },
    );
  }

  const adapter = createAdapter(parsed.data.connection);

  try {
    await adapter.connect();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      {
        ok: false,
        code: "CONNECTION_FAILED",
        message: `Failed to connect: ${msg}`,
      } satisfies ApiResponse<never>,
      { status: 502 },
    );
  }

  let schema: SchemaSnapshot;
  try {
    schema = await adapter.introspect();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await adapter.disconnect().catch(() => {});
    return Response.json(
      {
        ok: false,
        code: "INTROSPECTION_FAILED",
        message: `Schema introspection failed: ${msg}`,
      } satisfies ApiResponse<never>,
      { status: 502 },
    );
  }

  await adapter.disconnect().catch(() => {});

  return Response.json({
    ok: true,
    schema,
    dbType: parsed.data.connection.type,
    database:
      parsed.data.connection.type === "sqlite"
        ? parsed.data.connection.filepath
        : parsed.data.connection.database,
  } satisfies ApiResponse<{
    schema: SchemaSnapshot;
    dbType: string;
    database: string;
  }>);
}
