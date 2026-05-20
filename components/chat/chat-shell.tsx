"use client";

import { FormEvent, useCallback, useState, useTransition } from "react";
import {
  ApiResponse,
  McpConnection,
  QueryDraft,
  QueryResult,
  ResultExplanation,
  SchemaSnapshot,
} from "@/lib/types/query";
import {
  ChatMessage as ChatMsg,
  createMessageId,
} from "@/lib/types/chat";
import { postJson } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { Greeting } from "./greeting";
import { ConnectDialog } from "./connect-dialog";
import { Message } from "./message";

/* ── API response types (unchanged from original) ── */

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

/* ── Main shell ── */

export function ChatShell() {
  /* Connection state */
  const [connection, setConnection] = useState<McpConnection | null>(null);
  const [schema, setSchema] = useState<SchemaSnapshot | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);

  /* Conversation state */
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();

  /* Track last draft for approval flow */
  const [lastDraft, setLastDraft] = useState<{
    draft: QueryDraft;
    safeSql: string;
    question: string;
  } | null>(null);

  /* ── Connect ── */
  const handleConnect = useCallback(
    (endpoint: string, token: string) => {
      startTransition(async () => {
        const nextConnection = { endpoint, token: token || undefined };
        const response = await postJson<ConnectResponse>(
          "/api/mcp/connect",
          nextConnection,
        );

        if (!response.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              role: "assistant",
              type: "error",
              message: response.message,
            },
          ]);
          return;
        }

        setConnection(nextConnection);
        setSchema(response.schema);
        setConnectOpen(false);
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "system",
            content: `Connected to MCP server. Found ${response.schema.tables.length} tables and ${Object.values(response.selectedTools).filter(Boolean).length} tools.`,
          },
        ]);
      });
    },
    [startTransition],
  );

  /* ── Ask a question ── */
  const handleAsk = useCallback(() => {
    if (!question.trim()) return;

    const currentQuestion = question.trim();
    setQuestion("");

    /* Add user message */
    const userMsgId = createMessageId();
    const thinkingId = createMessageId();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: currentQuestion },
      { id: thinkingId, role: "assistant", type: "thinking" },
    ]);

    if (!schema) {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingId)
          .concat({
            id: createMessageId(),
            role: "assistant",
            type: "error",
            message:
              "Connect to a database first. Click the connection button in the header.",
          }),
      );
      return;
    }

    startTransition(async () => {
      const response = await postJson<DraftResponse>("/api/query/draft", {
        question: currentQuestion,
        schema,
      });

      /* Remove thinking indicator */
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            type: "error",
            message: response.message,
          },
        ]);
        return;
      }

      const safeSql =
        response.validation && response.validation.ok
          ? response.validation.normalizedSql
          : "";
      const validationError =
        response.validation && !response.validation.ok
          ? response.validation.reason
          : undefined;

      setLastDraft({
        draft: response.draft,
        safeSql,
        question: currentQuestion,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          type: "draft",
          draft: response.draft,
          safeSql,
          validationError,
        },
      ]);
    });
  }, [question, schema, startTransition]);

  /* ── Execute approved SQL ── */
  const handleApprove = useCallback(
    (sql: string) => {
      if (!connection || !lastDraft) return;

      const thinkingId = createMessageId();
      setMessages((prev) => [
        ...prev,
        { id: thinkingId, role: "assistant", type: "thinking" },
      ]);

      startTransition(async () => {
        const response = await postJson<ExecuteResponse>(
          "/api/query/execute",
          {
            connection,
            sql,
            question: lastDraft.question,
            caveats: lastDraft.draft.caveats ?? [],
            approved: true,
            maxRows: 500,
          },
        );

        /* Remove thinking */
        setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

        if (!response.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              role: "assistant",
              type: "error",
              message: response.message,
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            type: "result",
            sql: response.sql,
            result: response.result,
            explanation: response.explanation,
            statusText: response.result.truncated
              ? `Returned ${response.result.rows.length} rows (truncated).`
              : `Returned ${response.result.rowCount} rows.`,
          },
        ]);
      });
    },
    [connection, lastDraft, startTransition],
  );

  /* ── Suggested action click ── */
  const handleSuggestion = useCallback(
    (text: string) => {
      setQuestion(text);
      /* Defer submit to next tick so state updates */
      setTimeout(() => {
        setQuestion("");
        const userMsgId = createMessageId();
        const thinkingId = createMessageId();

        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user", content: text },
          { id: thinkingId, role: "assistant", type: "thinking" },
        ]);

        if (!schema) {
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== thinkingId)
              .concat({
                id: createMessageId(),
                role: "assistant",
                type: "error",
                message:
                  "Connect to a database first. Click the connection button in the header.",
              }),
          );
          return;
        }

        startTransition(async () => {
          const response = await postJson<DraftResponse>(
            "/api/query/draft",
            { question: text, schema },
          );

          setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

          if (!response.ok) {
            setMessages((prev) => [
              ...prev,
              {
                id: createMessageId(),
                role: "assistant",
                type: "error",
                message: response.message,
              },
            ]);
            return;
          }

          const safeSql =
            response.validation && response.validation.ok
              ? response.validation.normalizedSql
              : "";
          const validationError =
            response.validation && !response.validation.ok
              ? response.validation.reason
              : undefined;

          setLastDraft({ draft: response.draft, safeSql, question: text });

          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              role: "assistant",
              type: "draft",
              draft: response.draft,
              safeSql,
              validationError,
            },
          ]);
        });
      }, 0);
    },
    [schema, startTransition],
  );

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        connected={!!connection}
        tableCount={schema?.tables.length ?? 0}
        onConnectClick={() => setConnectOpen(true)}
      />

      <ChatMessages>
        {messages.length === 0 ? (
          <Greeting onSuggestionClick={handleSuggestion} />
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              onApprove={handleApprove}
              isPending={isPending}
            />
          ))
        )}
      </ChatMessages>

      <ChatInput
        value={question}
        onChange={setQuestion}
        onSubmit={handleAsk}
        disabled={false}
        isPending={isPending}
        placeholder={
          schema
            ? "Ask a question about your data..."
            : "Connect a database first, then ask away..."
        }
      />

      {connectOpen && (
        <ConnectDialog
          onConnect={handleConnect}
          onClose={() => setConnectOpen(false)}
          isPending={isPending}
        />
      )}
    </div>
  );
}
