import Link from "next/link";
import { docs } from "@/lib/docs";
import { SendIcon } from "@/components/chat/icons";

export default function DocsOverviewPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Documentation
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Everything you need to use Natural QL
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Natural QL lets you ask your database questions in plain English. It writes
        the SQL, shows it to you, and only runs it after you approve, and it can never
        change your data. Pick a guide to get started.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-ring/30 hover:shadow-md"
          >
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              {doc.title}
              <SendIcon
                size={15}
                className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground"
              />
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {doc.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6">
        <h2 className="text-base font-semibold tracking-tight">Prefer to dive in?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You can open the app and connect a database right now. The guides are here
          whenever you need them.
        </p>
        <Link
          href="/app"
          className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open the app
        </Link>
      </div>
    </div>
  );
}
