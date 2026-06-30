import Link from "next/link";
import type { Metadata } from "next";
import { SparklesIcon } from "@/components/chat/icons";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export const metadata: Metadata = {
  title: "Docs · Natural QL",
  description:
    "How to connect a database, ask questions in plain English, and how Natural QL works under the hood.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <SparklesIcon size={16} />
              </span>
              <span className="text-sm font-semibold tracking-tight">Natural QL</span>
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">Docs</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/therealharshit/NaturalQL"
              className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              GitHub
            </a>
            <Link
              href="/app"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        <DocsSidebar />
        <main className="min-w-0 flex-1 pb-24">{children}</main>
      </div>
    </div>
  );
}
