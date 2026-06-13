"use client";

import type { ChatMessage } from "@/lib/types/chat";
import {
  SparklesIcon,
  AlertTriangleIcon,
  DatabaseIcon,
} from "./icons";

type MessageProps = {
  message: ChatMessage;
};

export function Message({ message }: MessageProps) {
  switch (message.role) {
    case "user":
      return <UserBubble content={message.content} />;
    case "system":
      return <SystemBubble content={message.content} />;
    case "assistant":
      switch (message.type) {
        case "thinking":
          return <ThinkingIndicator />;
        case "text":
          return (
            <AssistantWrapper>
              <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
                {message.content}
              </div>
            </AssistantWrapper>
          );
        case "error":
          return <ErrorBubble content={message.message} />;
        default:
          return null;
      }
    default:
      return null;
  }
}

/* ── Sub-components ── */

function UserBubble({ content }: { content: string }) {
  return (
    <div className="animate-message-in flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm">
        {content}
      </div>
    </div>
  );
}

function AssistantWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground">
        <SparklesIcon size={14} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="animate-message-in flex gap-3">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground">
        <SparklesIcon size={14} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-3">
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </div>
    </div>
  );
}

function SystemBubble({ content }: { content: string }) {
  return (
    <div className="animate-message-in flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground shadow-sm">
        <DatabaseIcon size={12} className="text-success" />
        {content}
      </div>
    </div>
  );
}

function ErrorBubble({ content }: { content: string }) {
  return (
    <div className="animate-message-in flex gap-3">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangleIcon size={14} />
      </div>
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-foreground">
        {content}
      </div>
    </div>
  );
}
