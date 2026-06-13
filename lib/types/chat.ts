/** Every message in the chat conversation. */
export type ChatMessage =
  | UserMessage
  | AssistantTextMessage
  | AssistantErrorMessage
  | SystemMessage
  | AssistantThinkingMessage;

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
