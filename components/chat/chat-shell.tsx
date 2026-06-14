"use client";

import { useCallback, useRef, useState } from "react";
import {
  ChatMessage as ChatMsg,
  createMessageId,
} from "@/lib/types/chat";
import type {
  DbConnection,
  SchemaSnapshot,
  QueryDraft,
  QueryResult,
  ResultExplanation,
} from "@/lib/types/query";
import { postJson } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { Greeting } from "./greeting";
import { ConnectDialog } from "./connect-dialog";
import { Message } from "./message";

type ConnectResponse = {
  ok: boolean;
  schema?: SchemaSnapshot;
  dbType?: string;
  database?: string;
  code?: string;
  message?: string;
};

type DraftResponse = {
  ok: boolean;
  draft?: QueryDraft;
  safeSql?: string | null;
  validationError?: string | null;
  code?: string;
  message?: string;
};

type ExecuteResponse = {
  ok: boolean;
  result?: QueryResult;
  explanation?: ResultExplanation;
  sql?: string;
  code?: string;
  message?: string;
};

export function ChatShell() {
  /* Connection state */
  const [connected, setConnected] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectPending, setConnectPending] = useState(false);
  const [connectError, setConnectError] = useState<string | undefined>();
  const [dbName, setDbName] = useState("");

  /* Stored connection + schema for API calls */
  const connectionRef = useRef<DbConnection | null>(null);
  const schemaRef = useRef<SchemaSnapshot | null>(null);

  /* Conversation state */
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [approvePending, setApprovePending] = useState(false);

  /* Track current question for execute context */
  const lastQuestionRef = useRef("");

  /* ── Connect ── */
  const handleConnect = useCallback(async (connection: DbConnection) => {
    setConnectPending(true);
    setConnectError(undefined);

    try {
      const resp = await postJson<ConnectResponse>("/api/connect", {
        connection,
      });

      if (!resp.ok) {
        setConnectError(resp.message ?? "Connection failed.");
        setConnectPending(false);
        return;
      }

      connectionRef.current = connection;
      schemaRef.current = resp.schema!;
      setDbName(resp.database ?? "database");
      setConnected(true);
      setConnectOpen(false);

      const tableCount = resp.schema?.tables.length ?? 0;
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "system",
          content: `Connected to ${resp.database} (${resp.dbType}) · ${tableCount} table${tableCount !== 1 ? "s" : ""} found`,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setConnectError(msg);
    } finally {
      setConnectPending(false);
    }
  }, []);

  /* ── Ask a question ── */
  const handleAsk = useCallback(
    async (text?: string) => {
      const q = (text ?? question).trim();
      if (!q) return;

      setQuestion("");
      lastQuestionRef.current = q;

      /* Add user message + thinking indicator */
      const userMsgId = createMessageId();
      const thinkingId = createMessageId();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: q },
        { id: thinkingId, role: "assistant", type: "thinking" },
      ]);

      if (!connected || !connectionRef.current || !schemaRef.current) {
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

      setIsPending(true);

      try {
        const resp = await postJson<DraftResponse>("/api/query/draft", {
          connection: connectionRef.current,
          question: q,
          schema: schemaRef.current,
        });

        if (!resp.ok) {
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== thinkingId)
              .concat({
                id: createMessageId(),
                role: "assistant",
                type: "error",
                message: resp.message ?? "Failed to generate SQL.",
              }),
          );
          return;
        }

        /* Add draft message */
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== thinkingId)
            .concat({
              id: createMessageId(),
              role: "assistant",
              type: "draft",
              draft: resp.draft!,
              safeSql: resp.safeSql ?? "",
              validationError: resp.validationError ?? undefined,
            }),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Request failed.";
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== thinkingId)
            .concat({
              id: createMessageId(),
              role: "assistant",
              type: "error",
              message: msg,
            }),
        );
      } finally {
        setIsPending(false);
      }
    },
    [question, connected],
  );

  /* ── Approve & Run SQL ── */
  const handleApprove = useCallback(
    async (sql: string) => {
      if (!connectionRef.current) return;

      setApprovePending(true);

      /* Add thinking indicator */
      const thinkingId = createMessageId();
      setMessages((prev) => [
        ...prev,
        { id: thinkingId, role: "assistant", type: "thinking" },
      ]);

      try {
        const resp = await postJson<ExecuteResponse>("/api/query/execute", {
          connection: connectionRef.current,
          sql,
          question: lastQuestionRef.current,
        });

        if (!resp.ok) {
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== thinkingId)
              .concat({
                id: createMessageId(),
                role: "assistant",
                type: "error",
                message: resp.message ?? "Query execution failed.",
              }),
          );
          return;
        }

        setMessages((prev) =>
          prev
            .filter((m) => m.id !== thinkingId)
            .concat({
              id: createMessageId(),
              role: "assistant",
              type: "result",
              sql: resp.sql ?? sql,
              result: resp.result!,
              explanation: resp.explanation!,
              statusText: `${resp.result!.rowCount} row${resp.result!.rowCount !== 1 ? "s" : ""} returned${resp.result!.truncated ? " (truncated)" : ""}`,
            }),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Execution failed.";
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== thinkingId)
            .concat({
              id: createMessageId(),
              role: "assistant",
              type: "error",
              message: msg,
            }),
        );
      } finally {
        setApprovePending(false);
      }
    },
    [],
  );

  /* ── Suggested action click ── */
  const handleSuggestion = useCallback(
    (text: string) => {
      handleAsk(text);
    },
    [handleAsk],
  );

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        connected={connected}
        dbName={dbName}
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
              isApprovePending={approvePending}
            />
          ))
        )}
      </ChatMessages>

      <ChatInput
        value={question}
        onChange={setQuestion}
        onSubmit={() => handleAsk()}
        disabled={false}
        isPending={isPending}
        placeholder={
          connected
            ? "Ask a question about your data..."
            : "Connect a database first, then ask away..."
        }
      />

      {connectOpen && (
        <ConnectDialog
          onConnect={handleConnect}
          onClose={() => {
            setConnectOpen(false);
            setConnectError(undefined);
          }}
          isPending={connectPending}
          error={connectError}
        />
      )}
    </div>
  );
}
