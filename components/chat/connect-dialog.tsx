"use client";

import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { XIcon, PlugIcon, LoaderIcon } from "./icons";

type ConnectDialogProps = {
  onConnect: () => void;
  onClose: () => void;
  isPending: boolean;
};

export function ConnectDialog({
  onConnect,
  onClose,
  isPending,
}: ConnectDialogProps) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!host.trim() || !user.trim() || !database.trim()) return;
    onConnect(); // Dummy connect
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
                  Direct PostgreSQL connection
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
            <div className="flex gap-4">
              <label className="block flex-1">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Host
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                  placeholder="localhost"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  autoFocus
                />
              </label>

              <label className="block w-24">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Port
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                  placeholder="5432"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </label>
            </div>

            <div className="flex gap-4">
              <label className="block flex-1">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  User
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                  placeholder="postgres"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </label>

              <label className="block flex-1">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </span>
                <input
                  type="password"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Database Name
              </span>
              <input
                type="text"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                placeholder="my_database"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={isPending || !host.trim() || !user.trim() || !database.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                isPending || !host.trim() || !user.trim() || !database.trim()
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
            Connection runs locally
          </p>
        </div>
      </div>
    </>
  );
}
