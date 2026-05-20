"use client";

import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { XIcon, PlugIcon, LoaderIcon } from "./icons";

type ConnectDialogProps = {
  onConnect: (endpoint: string, token: string) => void;
  onClose: () => void;
  isPending: boolean;
};

export function ConnectDialog({
  onConnect,
  onClose,
  isPending,
}: ConnectDialogProps) {
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!endpoint.trim()) return;
    onConnect(endpoint.trim(), token.trim());
  };

  return (
    <>
      {/* Backdrop */}
      <div className="dialog-overlay" onClick={onClose} />

      {/* Dialog */}
      <div className="dialog-content w-full max-w-md px-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <PlugIcon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Connect Database
                </h2>
                <p className="text-xs text-muted-foreground">
                  Remote MCP server
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                MCP endpoint URL
              </span>
              <input
                type="url"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                placeholder="https://your-mcp-server.example.com/mcp"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                autoFocus
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Bearer token
              </span>
              <input
                type="password"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                placeholder="Optional"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={isPending || !endpoint.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                isPending || !endpoint.trim()
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
              )}
            >
              {isPending ? (
                <>
                  <LoaderIcon size={16} className="animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect safely"
              )}
            </button>
          </form>

          {/* Safety note */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            HTTPS only · Private network blocking · Read-only SQL
          </p>
        </div>
      </div>
    </>
  );
}
