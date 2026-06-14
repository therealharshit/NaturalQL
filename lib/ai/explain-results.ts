import { GoogleGenAI } from "@google/genai";
import type { QueryResult, ResultExplanation } from "@/lib/types/query";
import { ResultExplanationSchema } from "@/lib/types/query";

/**
 * Use Gemini to explain query results in natural language.
 */
export async function explainResults(opts: {
  question: string;
  sql: string;
  result: QueryResult;
}): Promise<ResultExplanation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  /* Truncate result data for the prompt to avoid token limits */
  const previewRows = opts.result.rows.slice(0, 20);
  const resultPreview = JSON.stringify(previewRows, null, 2);

  const systemPrompt = `You are a data analyst assistant. A user asked a database question, SQL was generated and executed. Explain the results in plain English.

Rules:
- summary: One or two sentences that directly answer the user's question.
- findings: Key data insights from the results (each a single sentence).
- caveats: Any limitations, approximations, or things the user should know.
- Be concise and clear. Reference actual values from the results when possible.`;

  const userPrompt = `Question: ${opts.question}

SQL executed:
${opts.sql}

Results (${opts.result.rowCount} rows, ${opts.result.columns.length} columns${opts.result.truncated ? ", truncated" : ""}):
${resultPreview}`;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object" as const,
        properties: {
          summary: { type: "string" as const },
          findings: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          caveats: {
            type: "array" as const,
            items: { type: "string" as const },
          },
        },
        required: ["summary", "findings", "caveats"],
      },
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text);
  return ResultExplanationSchema.parse(parsed);
}
