"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types/chat";

/* ── Types ── */

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number; // epoch ms
  dbName?: string;
};

type ChatHistoryState = {
  conversations: Conversation[];
  activeId: string;
};

/* ── Storage key ── */

const STORAGE_KEY = "nql-chat-history";

/* ── Helpers ── */

function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Derive a title from the first user message, truncated. */
function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first || !("content" in first)) return "New Chat";
  const text = first.content;
  return text.length > 40 ? text.slice(0, 40) + "…" : text;
}

function createEmptyConversation(): Conversation {
  return {
    id: generateId(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
  };
}

function loadFromStorage(): ChatHistoryState {
  if (typeof window === "undefined") {
    const conv = createEmptyConversation();
    return { conversations: [conv], activeId: conv.id };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatHistoryState;
      if (parsed.conversations.length > 0) {
        return parsed;
      }
    }
  } catch {
    /* corrupted storage, start fresh */
  }
  const conv = createEmptyConversation();
  return { conversations: [conv], activeId: conv.id };
}

function saveToStorage(state: ChatHistoryState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full, silently ignore */
  }
}

/* ── Hook ── */

export function useChatHistory() {
  const [state, setState] = useState<ChatHistoryState>(loadFromStorage);

  /* Persist on every state change */
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    saveToStorage(stateRef.current);
  }, [state]);

  /* Active conversation accessor */
  const activeConversation =
    state.conversations.find((c) => c.id === state.activeId) ??
    state.conversations[0];

  /* Create a new chat */
  const createChat = useCallback(() => {
    const newConv = createEmptyConversation();
    setState((prev) => ({
      conversations: [newConv, ...prev.conversations],
      activeId: newConv.id,
    }));
    return newConv.id;
  }, []);

  /* Switch to an existing chat */
  const switchChat = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeId: id }));
  }, []);

  /* Delete a chat */
  const deleteChat = useCallback((id: string) => {
    setState((prev) => {
      const remaining = prev.conversations.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const newConv = createEmptyConversation();
        return { conversations: [newConv], activeId: newConv.id };
      }
      const newActiveId =
        prev.activeId === id ? remaining[0].id : prev.activeId;
      return { conversations: remaining, activeId: newActiveId };
    });
  }, []);

  /* Update messages for the active conversation */
  const updateMessages = useCallback((messages: ChatMessage[]) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === prev.activeId
          ? { ...c, messages, title: deriveTitle(messages) || c.title }
          : c,
      ),
    }));
  }, []);

  /* Update dbName for the active conversation */
  const updateDbName = useCallback((dbName: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === prev.activeId ? { ...c, dbName } : c,
      ),
    }));
  }, []);

  return {
    conversations: state.conversations,
    activeId: state.activeId,
    activeConversation,
    createChat,
    switchChat,
    deleteChat,
    updateMessages,
    updateDbName,
  };
}
