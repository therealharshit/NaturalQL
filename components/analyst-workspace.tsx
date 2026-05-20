"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  ApiResponse,
  McpConnection,
  QueryDraft,
  QueryResult,
  ResultExplanation,
  SchemaSnapshot,
} from "@/lib/types/query";

type ConnectResponse = ApiResponse<{
  schema: SchemaSnapshot;
  tools: Array<{ name: string; description?: string }>;
  selectedTools: Record<string, string | undefined>;
}>;

type DraftResponse = ApiResponse<{
  draft: QueryDraft;
  validation?:
    | { ok: true; normalizedSql: string; tablesReferenced: string[] }
    | { ok: false; reason: string };
}>;

type ExecuteResponse = ApiResponse<{
  sql: string;
  result: QueryResult;
  explanation: ResultExplanation;
  tablesReferenced: string[];
}>;

export function AnalystWorkspace() {
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");
  const [connection, setConnection] = useState<McpConnection | null>(null);
  const [schema, setSchema] = useState<SchemaSnapshot | null>(null);
  const [question, setQuestion] = useState("");
  const [draft, setDraft] = useState<QueryDraft | null>(null);
  const [safeSql, setSafeSql] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [explanation, setExplanation] = useState<ResultExplanation | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function connect(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const nextConnection = { endpoint, token: token || undefined };
      const response = await postJson<ConnectResponse>(
        "/api/mcp/connect",
        nextConnection,
      );

      if (!response.ok) {
        setMessage(response.message);
        return;
      }

      setConnection(nextConnection);
      setSchema(response.schema);
      setDraft(null);
      setResult(null);
      setExplanation(null);
      setMessage(
        `Connected. Found ${response.schema.tables.length} tables and selected ${Object.values(response.selectedTools).filter(Boolean).length} MCP tools.`,
      );
    });
  }

  function ask(event: FormEvent) {
    event.preventDefault();
    if (!schema) return;

    setMessage("");
    setResult(null);
    setExplanation(null);
    startTransition(async () => {
      const response = await postJson<DraftResponse>("/api/query/draft", {
        question,
        schema,
      });

      if (!response.ok) {
        setMessage(response.message);
        return;
      }

      setDraft(response.draft);
      if (response.validation?.ok) {
        setSafeSql(response.validation.normalizedSql);
      } else {
        setSafeSql("");
        if (response.validation && !response.validation.ok) {
          setMessage(response.validation.reason);
        }
      }
    });
  }

  function execute() {
    if (!connection || !safeSql) return;

    setMessage("");
    startTransition(async () => {
      const response = await postJson<ExecuteResponse>("/api/query/execute", {
        connection,
        sql: safeSql,
        question,
        caveats: draft?.caveats ?? [],
        approved: true,
        maxRows: 500,
      });

      if (!response.ok) {
        setMessage(response.message);
        return;
      }

      setSafeSql(response.sql);
      setResult(response.result);
      setExplanation(response.explanation);
      setMessage(
        response.result.truncated
          ? `Returned ${response.result.rows.length} rows. Result was truncated.`
          : `Returned ${response.result.rowCount} rows.`,
      );
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-stone-300 bg-white/80 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
          Connection
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-stone-950">
          Connect a remote MCP database server
        </h2>
        <form className="mt-6 space-y-4" onSubmit={connect}>
          <label className="block text-sm font-medium text-stone-700">
            MCP endpoint URL
            <input
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-950 outline-none focus:border-stone-900"
              placeholder="https://your-mcp-server.example.com/mcp"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Bearer token
            <input
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-950 outline-none focus:border-stone-900"
              placeholder="Optional"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
          <button
            className="w-full rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={isPending || !endpoint}
          >
            {isPending ? "Working..." : "Connect safely"}
          </button>
        </form>
        {schema ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">
            Schema snapshot ready: {schema.tables.length} tables.
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-stone-300 bg-stone-950 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">
          Ask
        </p>
        <h2 className="mt-3 text-2xl font-semibold">
          Draft SQL before anything runs
        </h2>
        <form className="mt-6 space-y-4" onSubmit={ask}>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-stone-400 focus:border-white"
            placeholder="Show me the top 5 customers by revenue last month"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button
            className="rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-stone-950 disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-300"
            disabled={isPending || !schema || !question}
          >
            Draft query
          </button>
        </form>

        {draft?.needsClarification ? (
          <div className="mt-6 rounded-2xl border border-amber-200/40 bg-amber-200/10 p-4">
            <p className="text-sm text-amber-100">Needs clarification</p>
            <p className="mt-2">{draft.clarifyingQuestion}</p>
          </div>
        ) : null}

        {safeSql ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-sm text-stone-400">Validated read-only SQL</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm text-amber-100">
                {safeSql}
              </pre>
            </div>
            <button
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-stone-950 disabled:bg-stone-600 disabled:text-stone-300"
              disabled={isPending}
              onClick={execute}
              type="button"
            >
              Approve and run
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-stone-300 bg-white/80 p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Results
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              Table and caveats
            </h2>
          </div>
          {message ? (
            <p className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-700">
              {message}
            </p>
          ) : null}
        </div>

        {draft ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoCard
              title="Confidence"
              value={`${Math.round(draft.confidence * 100)}%`}
            />
            <InfoCard
              title="Tables"
              value={draft.tablesReferenced.join(", ") || "None"}
            />
            <InfoCard
              title="Assumptions"
              value={draft.assumptions.join("; ") || "None"}
            />
          </div>
        ) : null}

        {explanation ? (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
              Explanation
            </p>
            <p className="mt-3 text-lg font-medium text-stone-950">
              {explanation.summary}
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-700">
              {explanation.findings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
            {explanation.caveats.length > 0 ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
                {explanation.caveats.join(" ")}
              </div>
            ) : null}
          </div>
        ) : null}

        {result ? <ResultsTable result={result} /> : null}
      </section>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </p>
      <p className="mt-2 text-sm text-stone-800">{value}</p>
    </div>
  );
}

function ResultsTable({ result }: { result: QueryResult }) {
  if (result.rows.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-stone-100 p-6 text-stone-700">
        The query ran successfully but returned no rows.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-100">
          <tr>
            {result.columns.map((column) => (
              <th
                className="px-4 py-3 text-left font-semibold text-stone-700"
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 bg-white">
          {result.rows.map((row, index) => (
            <tr key={index}>
              {result.columns.map((column) => (
                <td className="px-4 py-3 text-stone-800" key={column}>
                  {formatCell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return (await response.json()) as T;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
