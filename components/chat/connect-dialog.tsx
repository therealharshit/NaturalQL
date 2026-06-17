"use client";

import { FormEvent, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { DbConnection, DbType } from "@/lib/types/query";
import { XIcon, PlugIcon, LoaderIcon } from "./icons";

type ConnectDialogProps = {
  onConnect: (connection: DbConnection) => void;
  onClose: () => void;
  isPending: boolean;
  error?: string;
};

const DB_TYPES: { value: DbType; label: string; defaultPort: string }[] = [
  { value: "postgresql", label: "PostgreSQL", defaultPort: "5432" },
  { value: "mysql", label: "MySQL", defaultPort: "3306" },
  { value: "sqlite", label: "SQLite", defaultPort: "" },
];

export function ConnectDialog({
  onConnect,
  onClose,
  isPending,
  error,
}: ConnectDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [dbType, setDbType] = useState<DbType>("postgresql");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");
  const [filepath, setFilepath] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSqlite = dbType === "sqlite";

  const canSubmit = isSqlite
    ? filepath.trim().length > 0
    : host.trim().length > 0 &&
      user.trim().length > 0 &&
      database.trim().length > 0;

  const handleDbTypeChange = (type: DbType) => {
    setDbType(type);
    const entry = DB_TYPES.find((d) => d.value === type);
    if (entry?.defaultPort) setPort(entry.defaultPort);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    if (isSqlite) {
      onConnect({ type: "sqlite", filepath: filepath.trim() });
    } else {
      onConnect({
        type: dbType as "postgresql" | "mysql",
        host: host.trim(),
        port: parseInt(port, 10) || (dbType === "mysql" ? 3306 : 5432),
        user: user.trim(),
        password,
        database: database.trim(),
      });
    }
  };

  if (!mounted) return null;

  return createPortal(
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
                  PostgreSQL · MySQL · SQLite
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
            {/* Database type selector */}
            <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
              {DB_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleDbTypeChange(type.value)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    dbType === type.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {isSqlite ? (
              /* SQLite: just a file path */
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Database File Path
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/20"
                  placeholder="/path/to/database.db"
                  value={filepath}
                  onChange={(e) => setFilepath(e.target.value)}
                  autoFocus
                />
              </label>
            ) : (
              /* PostgreSQL / MySQL: host, port, user, password, database */
              <>
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
                      placeholder={dbType === "mysql" ? "3306" : "5432"}
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
                      placeholder={dbType === "mysql" ? "root" : "postgres"}
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
              </>
            )}

            {/* Error message */}
            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                isPending || !canSubmit
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
                "Connect"
              )}
            </button>
          </form>

          {/* Safety note */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Queries run as read-only · Credentials stay in your browser
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}
