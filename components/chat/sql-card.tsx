"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { QueryDraft } from "@/lib/types/query";
import {
  CheckIcon,
  AlertTriangleIcon,
  PlayIcon,
  ChevronDownIcon,
  CopyIcon,
  TableIcon,
} from "./icons";

type SqlCardProps = {
  draft: QueryDraft;
  safeSql: string;
  validationError?: string;
  onApprove: (sql: string) => void;
  isPending: boolean;
};

export function SqlCard({
  draft,
  safeSql,
  validationError,
  onApprove,
  isPending,
}: SqlCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const confidencePercent = Math.round(draft.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80
      ? "text-success"
      : confidencePercent >= 50
        ? "text-warning"
        : "text-destructive";

  const handleCopy = () => {
    const sql = safeSql || draft.sql || "";
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Clarification needed */
  if (draft.needsClarification) {
    return (
      <div className="animate-message-in rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangleIcon
            size={18}
            className="mt-0.5 shrink-0 text-warning"
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              Need more details
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {draft.clarifyingQuestion}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displaySql = safeSql || draft.sql || "";

  return (
    <div className="animate-message-in rounded-2xl border border-border bg-card shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-semibold", confidenceColor)}>
            {confidencePercent}%
          </span>
          <span className="text-xs text-muted-foreground">confidence</span>
          {safeSql ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <CheckIcon size={11} />
              Validated
            </span>
          ) : validationError ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              <AlertTriangleIcon size={11} />
              Failed
            </span>
          ) : null}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Copy SQL"
        >
          <CopyIcon size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* SQL block */}
      <div className="px-2 py-2">
        <pre className="!m-0 !rounded-xl !bg-[oklch(0.155_0_0)] !px-4 !py-3.5 text-[0.8125rem] leading-relaxed !text-[oklch(0.88_0.05_85)]">
          {displaySql}
        </pre>
      </div>

      {/* Details accordion */}
      <div className="border-t border-border">
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex w-full items-center justify-between px-5 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <TableIcon size={12} />
            {draft.tablesReferenced.join(", ") || "No tables"}
          </span>
          <ChevronDownIcon
            size={14}
            className={cn(
              "transition-transform",
              detailsOpen && "rotate-180",
            )}
          />
        </button>

        {detailsOpen && (
          <div className="animate-fade-in space-y-3 px-5 pb-4">
            {draft.assumptions.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Assumptions
                </p>
                <ul className="space-y-1 text-xs text-foreground">
                  {draft.assumptions.map((a) => (
                    <li key={a} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {draft.caveats.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Caveats
                </p>
                <ul className="space-y-1 text-xs text-foreground">
                  {draft.caveats.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warning" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-5 py-3">
          <p className="text-xs text-destructive">{validationError}</p>
        </div>
      )}

      {/* Approve button */}
      {safeSql && (
        <div className="border-t border-border px-5 py-3.5">
          <button
            onClick={() => onApprove(safeSql)}
            disabled={isPending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
              isPending
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
            )}
          >
            <PlayIcon size={14} />
            Approve &amp; Run
          </button>
        </div>
      )}
    </div>
  );
}
