import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  QueryResult,
  ResultExplanation,
  ResultExplanationSchema,
} from "@/lib/types/query";

export async function explainResults(input: {
  question: string;
  sql: string;
  result: QueryResult;
  caveats: string[];
}): Promise<ResultExplanation> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to explain query results.");
  }

  const client = new OpenAI({ apiKey });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content:
          "Explain database query results for a founder. Be concise, factual, and explicit about caveats. Do not invent facts beyond the returned rows.",
      },
      {
        role: "user",
        content: JSON.stringify({
          question: input.question,
          sql: input.sql,
          columns: input.result.columns,
          rows: input.result.rows.slice(0, 50),
          rowCount: input.result.rowCount,
          truncated: input.result.truncated,
          caveats: input.caveats,
        }),
      },
    ],
    text: {
      format: zodTextFormat(ResultExplanationSchema, "result_explanation"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("Model did not return a valid result explanation.");
  }

  return response.output_parsed;
}
