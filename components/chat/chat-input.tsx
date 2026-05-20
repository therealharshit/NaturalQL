"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, StopIcon } from "./icons";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isPending?: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  isPending = false,
  placeholder = "Ask a question about your data...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Auto-resize the textarea to fit content, max 200px. */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  /** Auto-focus on mount. */
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!disabled && !isPending && value.trim()) {
          onSubmit();
        }
      }
    },
    [disabled, isPending, value, onSubmit],
  );

  const handleFormSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!disabled && !isPending && value.trim()) {
        onSubmit();
      }
    },
    [disabled, isPending, value, onSubmit],
  );

  const canSubmit = !disabled && !isPending && value.trim().length > 0;

  return (
    <div className="border-t border-border bg-background">
      <form
        onSubmit={handleFormSubmit}
        className="mx-auto flex w-full max-w-3xl items-end gap-3 px-4 py-4 sm:px-6"
      >
        <div className="relative flex min-h-[52px] flex-1 items-end rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-ring/20">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent px-4 py-3.5 text-[0.9375rem] leading-relaxed text-foreground outline-none",
              "placeholder:text-muted-foreground",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            style={{ maxHeight: "200px" }}
          />
        </div>

        {isPending && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-destructive text-white transition-colors hover:bg-destructive/90"
            aria-label="Stop generating"
          >
            <StopIcon size={18} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl transition-all",
              canSubmit
                ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
            aria-label="Send message"
          >
            <ArrowUpIcon size={18} />
          </button>
        )}
      </form>
    </div>
  );
}
