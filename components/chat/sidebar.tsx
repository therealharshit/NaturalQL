"use client";

import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/hooks/use-chat-history";
import {
  PlusIcon,
  MessageSquareIcon,
  TrashIcon,
  PlugIcon,
  DatabaseIcon,
  XIcon,
} from "./icons";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onConnectClick: () => void;
  connected: boolean;
  dbName?: string;
  hydrated: boolean;
};

/* ── Date grouping helpers ── */

function getDateGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  if (date >= todayStart) return "Today";
  if (date >= yesterdayStart) return "Yesterday";
  if (date >= weekStart) return "Previous 7 Days";
  return "Older";
}

function groupConversations(
  conversations: Conversation[],
): { label: string; items: Conversation[] }[] {
  const sorted = [...conversations].sort((a, b) => b.createdAt - a.createdAt);
  const groups = new Map<string, Conversation[]>();
  const order = ["Today", "Yesterday", "Previous 7 Days", "Older"];

  for (const conv of sorted) {
    const group = getDateGroup(conv.createdAt);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(conv);
  }

  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }));
}

/* ── Component ── */

export function Sidebar({
  open,
  onClose,
  conversations,
  activeId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onConnectClick,
  connected,
  dbName,
  hydrated,
}: SidebarProps) {
  const grouped = groupConversations(conversations);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="sidebar-backdrop fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "sidebar-panel fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card md:relative md:z-auto",
          open ? "sidebar-open" : "sidebar-closed",
        )}
      >
        {/* Top actions */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <button
            onClick={onNewChat}
            className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <PlusIcon size={16} />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            aria-label="Close sidebar"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Connect DB button */}
        <div className="border-b border-border px-3 py-3">
          <button
            onClick={onConnectClick}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              connected
                ? "bg-success/5 text-success hover:bg-success/10"
                : "border border-dashed border-border text-muted-foreground hover:border-ring/40 hover:bg-accent hover:text-foreground",
            )}
          >
            {connected ? (
              <>
                <DatabaseIcon size={15} />
                <span className="truncate">{dbName || "Connected"}</span>
                <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-success" />
              </>
            ) : (
              <>
                <PlugIcon size={15} />
                Connect Database
              </>
            )}
          </button>
        </div>

        {/* Chat history list */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-2">
          {!hydrated ? (
            <div className="space-y-4 px-3 py-4">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/10" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-muted-foreground/5" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-muted-foreground/5" />
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group relative flex items-center rounded-lg transition-colors",
                      conv.id === activeId
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <button
                      onClick={() => onSelectChat(conv.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <MessageSquareIcon size={14} className="shrink-0" />
                      <span className="truncate text-sm">{conv.title}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(conv.id);
                      }}
                      className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete chat"
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Queries run as read-only
          </p>
        </div>
      </aside>
    </>
  );
}
