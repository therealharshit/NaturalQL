import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { guardedFetch } from "@/lib/mcp/validate-endpoint";
import {
  McpConnection,
  QueryResult,
  SchemaSnapshot,
  TableSchemaSchema,
} from "@/lib/types/query";

const TOOL_PATTERNS = {
  listTables: [/list.*tables/i, /schema/i],
  describeTable: [/describe.*table/i, /table.*schema/i],
  query: [/query/i, /execute.*sql/i, /read.*sql/i],
};

type McpTool = {
  name: string;
  description?: string;
};

type ToolSet = {
  listTables: string;
  describeTable?: string;
  query: string;
};

export async function inspectMcpServer(connection: McpConnection): Promise<{
  tools: McpTool[];
  selectedTools: ToolSet;
}> {
  return withMcpClient(connection, async (client) => {
    const { tools } = await client.listTools();
    const simplified = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
    const selectedTools = selectRequiredTools(simplified);
    return { tools: simplified, selectedTools };
  });
}

export async function loadSchemaSnapshot(
  connection: McpConnection,
): Promise<SchemaSnapshot> {
  return withMcpClient(connection, async (client) => {
    const { tools } = await client.listTools();
    const selectedTools = selectRequiredTools(tools);
    const listResult = await client.callTool({
      name: selectedTools.listTables,
      arguments: {},
    });
    const parsedTables = parseToolJson(listResult);
    const tableNames = normalizeTableNames(parsedTables);
    const tables = [];

    for (const tableName of tableNames.slice(0, 50)) {
      if (!selectedTools.describeTable) {
        tables.push({ name: tableName, columns: [] });
        continue;
      }

      const describeResult = await client.callTool({
        name: selectedTools.describeTable,
        arguments: { table: tableName, tableName },
      });
      const parsedTable = TableSchemaSchema.safeParse(parseToolJson(describeResult));
      tables.push(
        parsedTable.success ? parsedTable.data : { name: tableName, columns: [] },
      );
    }

    return {
      tables,
      generatedAt: new Date().toISOString(),
    };
  });
}

export async function executeReadOnlyQuery(
  connection: McpConnection,
  sql: string,
  maxRows: number,
): Promise<QueryResult> {
  return withMcpClient(connection, async (client) => {
    const { tools } = await client.listTools();
    const selectedTools = selectRequiredTools(tools);
    const result = await client.callTool({
      name: selectedTools.query,
      arguments: { sql, query: sql, maxRows },
    });
    const parsed = parseToolJson(result);
    return normalizeQueryResult(parsed, maxRows);
  });
}

function selectRequiredTools(tools: McpTool[]): ToolSet {
  const listTables = findTool(tools, TOOL_PATTERNS.listTables);
  const describeTable = findTool(tools, TOOL_PATTERNS.describeTable);
  const query = findTool(tools, TOOL_PATTERNS.query);

  if (!listTables || !query) {
    throw new Error(
      "MCP server must expose table/schema discovery and read-only query tools.",
    );
  }

  return { listTables, describeTable, query };
}

function findTool(tools: McpTool[], patterns: RegExp[]): string | undefined {
  return tools.find((tool) =>
    patterns.some((pattern) => pattern.test(`${tool.name} ${tool.description ?? ""}`)),
  )?.name;
}

async function withMcpClient<T>(
  connection: McpConnection,
  callback: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ name: "natural-ql", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(connection.endpoint), {
    fetch: guardedFetch,
    requestInit: {
      headers: connection.token
        ? { Authorization: `Bearer ${connection.token}` }
        : undefined,
    },
  });

  await client.connect(transport);
  try {
    return await callback(client);
  } finally {
    await client.close();
  }
}

function parseToolJson(result: unknown): unknown {
  if (!isRecord(result)) return result;
  const content = result.content;
  if (!Array.isArray(content)) return result;

  const textItem = content.find(
    (item) => isRecord(item) && item.type === "text" && typeof item.text === "string",
  ) as { text: string } | undefined;

  if (!textItem) return result;

  try {
    return JSON.parse(textItem.text);
  } catch {
    return textItem.text;
  }
}

function normalizeTableNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item
          : isRecord(item) && typeof item.name === "string"
            ? item.name
            : undefined,
      )
      .filter((name): name is string => Boolean(name));
  }

  if (isRecord(value) && Array.isArray(value.tables)) {
    return normalizeTableNames(value.tables);
  }

  return [];
}

function normalizeQueryResult(value: unknown, maxRows: number): QueryResult {
  const rows = isRecord(value) && Array.isArray(value.rows) ? value.rows : [];
  const safeRows = rows.filter(isRecord).slice(0, maxRows);
  const columns =
    isRecord(value) && Array.isArray(value.columns)
      ? value.columns.filter((column): column is string => typeof column === "string")
      : Array.from(new Set(safeRows.flatMap((row) => Object.keys(row))));

  return {
    columns,
    rows: safeRows,
    rowCount:
      isRecord(value) && typeof value.rowCount === "number"
        ? value.rowCount
        : safeRows.length,
    truncated: rows.length > safeRows.length,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
