import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  QueryDraft,
  QueryDraftSchema,
  SchemaSnapshot,
} from "@/lib/types/query";

export type DraftQueryInput = {
  question: string;
  schema: SchemaSnapshot;
};

export async function draftQuery(input: DraftQueryInput): Promise<QueryDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to draft SQL.");
  }

  const client = new OpenAI({ apiKey });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content:
          "You draft safe Postgres SELECT SQL for a database analyst app. Return structured output only. If the question is ambiguous, ask for clarification and do not guess SQL.",
      },
      {
        role: "user",
        content: JSON.stringify({
          question: input.question,
          schema: input.schema,
          rules: [
            "Generate Postgres SQL only.",
            "Generate exactly one read-only SELECT statement when possible.",
            "Never generate DDL, DML, transactions, temp table writes, procedure calls, or unsafe functions.",
            "Prefer clear assumptions and caveats over hidden guesses.",
          ],
        }),
      },
    ],
    text: {
      format: zodTextFormat(QueryDraftSchema, "query_draft"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("Model did not return a valid query draft.");
  }

  return response.output_parsed;
}
