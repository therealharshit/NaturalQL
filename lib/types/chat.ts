import type { QueryDraft, QueryResult, ResultExplanation } from "./query";

/** Every message in the chat conversation. */
export type ChatMessage =
  | UserMessage
  | AssistantTextMessage
  | AssistantErrorMessage
  | AssistantThinkingMessage
  | AssistantDraftMessage
  | AssistantResultMessage
  | SystemMessage;

export type UserMessage = {
  id: string;
  role: "user";
  content: string;
};

export type AssistantThinkingMessage = {
  id: string;
  role: "assistant";
  type: "thinking";
};

export type AssistantTextMessage = {
  id: string;
  role: "assistant";
  type: "text";
  content: string;
};

export type AssistantErrorMessage = {
  id: string;
  role: "assistant";
  type: "error";
  message: string;
};

/** AI-drafted SQL ready for user approval. */
export type AssistantDraftMessage = {
  id: string;
  role: "assistant";
  type: "draft";
  draft: QueryDraft;
  safeSql: string;
  validationError?: string;
};

/** Query execution results with AI explanation. */
export type AssistantResultMessage = {
  id: string;
  role: "assistant";
  type: "result";
  sql: string;
  result: QueryResult;
  explanation: ResultExplanation;
  statusText: string;
};

export type SystemMessage = {
  id: string;
  role: "system";
  content: string;
};

let counter = 0;

/** Generate a unique message ID. */
export function createMessageId(): string {
  return `msg-${Date.now()}-${++counter}`;
}
