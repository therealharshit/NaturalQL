import { z } from "zod";

/* ── Database connection ── */

export const DbTypeSchema = z.enum(["postgresql", "mysql", "sqlite"]);
export type DbType = z.infer<typeof DbTypeSchema>;

export const DbConnectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("postgresql"),
    host: z.string().min(1),
    port: z.coerce.number().int().positive().default(5432),
    user: z.string().min(1),
    password: z.string().default(""),
    database: z.string().min(1),
  }),
  z.object({
    type: z.literal("mysql"),
    host: z.string().min(1),
    port: z.coerce.number().int().positive().default(3306),
    user: z.string().min(1),
    password: z.string().default(""),
    database: z.string().min(1),
  }),
  z.object({
    type: z.literal("sqlite"),
    filepath: z.string().min(1),
  }),
]);

export type DbConnection = z.infer<typeof DbConnectionSchema>;

/* ── Schema introspection ── */

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

/* ── AI draft ── */

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

/* ── Query results ── */

export const QueryResultSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.unknown())),
  rowCount: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

export type QueryResult = z.infer<typeof QueryResultSchema>;

/* ── Result explanation ── */

export const ResultExplanationSchema = z.object({
  summary: z.string(),
  findings: z.array(z.string()),
  caveats: z.array(z.string()),
});

export type ResultExplanation = z.infer<typeof ResultExplanationSchema>;

/* ── API response envelope ── */

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "CONNECTION_FAILED"
  | "INTROSPECTION_FAILED"
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

/* ── API request schemas ── */

export const ConnectRequestSchema = z.object({
  connection: DbConnectionSchema,
});

export const DraftRequestSchema = z.object({
  connection: DbConnectionSchema,
  question: z.string().min(1),
  schema: SchemaSnapshotSchema,
});

export const ExecuteRequestSchema = z.object({
  connection: DbConnectionSchema,
  sql: z.string().min(1),
  question: z.string().optional(),
});
