"use client";

import { cn } from "@/lib/utils";
import { DatabaseIcon, SparklesIcon } from "./icons";

type ChatHeaderProps = {
  connected: boolean;
  dbName?: string;
  onConnectClick: () => void;
};

export function ChatHeader({
  connected,
  dbName,
  onConnectClick,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm sm:px-6">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <SparklesIcon size={16} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Natural QL
        </span>
      </div>

      {/* Connection status */}
      <button
        onClick={onConnectClick}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all hover:shadow-sm",
          connected
            ? "border-success/30 bg-success/5 text-success hover:bg-success/10"
            : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            connected ? "bg-success" : "bg-muted-foreground/40",
          )}
        />
        {connected ? (
          <>
            <DatabaseIcon size={12} />
            {dbName || "Connected"}
          </>
        ) : (
          "Connect database"
        )}
      </button>
    </header>
  );
}
