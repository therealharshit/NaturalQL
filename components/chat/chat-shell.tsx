"use client";

import { useCallback, useState } from "react";
import {
  ChatMessage as ChatMsg,
  createMessageId,
} from "@/lib/types/chat";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { Greeting } from "./greeting";
import { ConnectDialog } from "./connect-dialog";
import { Message } from "./message";

export function ChatShell() {
  /* Connection state */
  const [connected, setConnected] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  /* Conversation state */
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");

  /* ── Connect ── */
  const handleConnect = useCallback(() => {
    setIsPending(true);
    // Simulate connection delay
    setTimeout(() => {
      setConnected(true);
      setConnectOpen(false);
      setIsPending(false);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "system",
          content: "Database connected successfully.",
        },
      ]);
    }, 800);
  }, []);

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

    if (!connected) {
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

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== thinkingId),
        {
          id: createMessageId(),
          role: "assistant",
          type: "text",
          content: `This is a mock response for: "${currentQuestion}". Database logic is currently stripped out for the simple chatbot UI.`,
        },
      ]);
    }, 1500);
  }, [question, connected]);

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

        if (!connected) {
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

        // Simulate AI response
        setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== thinkingId),
            {
              id: createMessageId(),
              role: "assistant",
              type: "text",
              content: `This is a mock response for the suggested action: "${text}". Database logic is currently stripped out for the simple chatbot UI.`,
            },
          ]);
        }, 1500);
      }, 0);
    },
    [connected],
  );

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        connected={connected}
        onConnectClick={() => setConnectOpen(true)}
      />

      <ChatMessages>
        {messages.length === 0 ? (
          <Greeting onSuggestionClick={handleSuggestion} />
        ) : (
          messages.map((msg) => <Message key={msg.id} message={msg} />)
        )}
      </ChatMessages>

      <ChatInput
        value={question}
        onChange={setQuestion}
        onSubmit={handleAsk}
        disabled={false}
        isPending={false}
        placeholder={
          connected
            ? "Ask a question..."
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
