import { GoogleGenAI } from "@google/genai";
import type { SchemaSnapshot, QueryDraft, DbType } from "@/lib/types/query";
import { QueryDraftSchema } from "@/lib/types/query";

const DIALECT_NAMES: Record<DbType, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
};

/**
 * Use Gemini to draft a SQL query from a natural language question.
 */
export async function draftQuery(opts: {
  question: string;
  schema: SchemaSnapshot;
  dbType: DbType;
}): Promise<QueryDraft> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const dialect = DIALECT_NAMES[opts.dbType];

  const schemaText = opts.schema.tables
    .map((t) => {
      const cols = t.columns
        .map((c) => `  ${c.name} ${c.type ?? "unknown"}${c.nullable ? " NULL" : ""}`)
        .join("\n");
      return `TABLE ${t.name}\n${cols}`;
    })
    .join("\n\n");

  const systemPrompt = `You are a SQL assistant. Generate read-only ${dialect} SQL queries.

Rules:
- ONLY generate SELECT statements (or WITH ... SELECT for CTEs).
- NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or any write operations.
- Reference ONLY tables and columns that exist in the schema below.
- Use the correct ${dialect} SQL dialect and syntax.
- Set confidence between 0 and 1 based on how well the question maps to the schema.
- If the question is ambiguous or impossible given the schema, set needsClarification to true and provide a clarifyingQuestion.
- List all tables referenced in tablesReferenced.
- List any assumptions you made in assumptions.
- List any caveats (e.g. missing data, approximations) in caveats.
- Provide a brief explanationPlan describing how the SQL answers the question.

Database schema:
${schemaText}`;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: opts.question }],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object" as const,
        properties: {
          needsClarification: { type: "boolean" as const },
          clarifyingQuestion: {
            type: "string" as const,
            nullable: true,
          },
          sql: { type: "string" as const, nullable: true },
          tablesReferenced: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          assumptions: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          caveats: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          confidence: { type: "number" as const },
          explanationPlan: { type: "string" as const },
        },
        required: [
          "needsClarification",
          "clarifyingQuestion",
          "sql",
          "tablesReferenced",
          "assumptions",
          "caveats",
          "confidence",
          "explanationPlan",
        ],
      },
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return QueryDraftSchema.parse(parsed);
}
