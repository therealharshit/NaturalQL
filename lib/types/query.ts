import { z } from "zod";

export const McpConnectionSchema = z.object({
  endpoint: z.string().url(),
  token: z.string().optional(),
});

export type McpConnection = z.infer<typeof McpConnectionSchema>;

export const TableColumnSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  nullable: z.boolean().optional(),
});

export const TableSchemaSchema = z.object({
  name: z.string(),
  columns: z.array(TableColumnSchema).default([]),
  description: z.string().optional(),
});

export type TableSchema = z.infer<typeof TableSchemaSchema>;

export const SchemaSnapshotSchema = z.object({
  tables: z.array(TableSchemaSchema),
  generatedAt: z.string(),
});

export type SchemaSnapshot = z.infer<typeof SchemaSnapshotSchema>;

export const QueryDraftSchema = z.object({
  needsClarification: z.boolean(),
  clarifyingQuestion: z.string().nullable(),
  sql: z.string().nullable(),
  tablesReferenced: z.array(z.string()),
  assumptions: z.array(z.string()),
  caveats: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  explanationPlan: z.string(),
});

export type QueryDraft = z.infer<typeof QueryDraftSchema>;

export const QueryResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.unknown())),
  rowCount: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

export type QueryResult = z.infer<typeof QueryResultSchema>;

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNSAFE_ENDPOINT"
  | "MCP_CONNECTION_FAILED"
  | "MCP_TOOLS_UNAVAILABLE"
  | "AI_NOT_CONFIGURED"
  | "AI_DRAFT_FAILED"
  | "UNSAFE_SQL"
  | "QUERY_FAILED";

export type ApiError = {
  ok: false;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = T & { ok: true };

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
