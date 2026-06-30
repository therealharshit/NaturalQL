import Link from "next/link";
import {
  SparklesIcon,
  DatabaseIcon,
  ShieldIcon,
  TableIcon,
  CheckIcon,
  PlayIcon,
} from "@/components/chat/icons";

const GITHUB_URL = "https://github.com/therealharshit/NaturalQL";
const DEMO_URL = "https://youtu.be/FIOenBWCaoA";
const USER_GUIDE_URL = `${GITHUB_URL}/blob/main/docs/user-guide.md`;
const DEV_DOCS_URL = `${GITHUB_URL}/blob/main/docs/developer-docs.md`;

const features = [
  {
    icon: DatabaseIcon,
    title: "Multi-database support",
    description:
      "Connect directly to PostgreSQL, MySQL, or SQLite. Your credentials stay in the browser session and never touch a server.",
  },
  {
    icon: SparklesIcon,
    title: "AI SQL generation",
    description:
      "Ask in plain English. Natural QL drafts database-specific SQL with AI, tailored to your dialect.",
  },
  {
    icon: ShieldIcon,
    title: "Safety & guardrails",
    description:
      "Every draft is parsed and validated as read-only. Write statements, DDL, and multi-statement queries are rejected before they run.",
  },
  {
    icon: CheckIcon,
    title: "Approval-gated execution",
    description:
      "Nothing runs without you. Review the generated SQL and explicitly approve it before a single row is touched.",
  },
  {
    icon: TableIcon,
    title: "AI result explanations",
    description:
      "Results come back with a plain-language summary and key insights, so you understand the answer, not just the rows.",
  },
  {
    icon: PlayIcon,
    title: "Serverless-friendly",
    description:
      "No server-side connection state. Each request carries its own session credentials, so it scales cleanly anywhere.",
  },
];

const steps = [
  {
    step: "01",
    title: "Connect",
    description:
      "Point Natural QL at a PostgreSQL, MySQL, or SQLite database. Credentials are held per session in your browser.",
  },
  {
    step: "02",
    title: "Ask",
    description:
      "Type a question in plain English. Natural QL drafts validated, read-only SQL for your database dialect.",
  },
  {
    step: "03",
    title: "Approve & run",
    description:
      "Review the SQL, approve it, and get your results back with an AI-written summary and insights.",
  },
];

const databases = ["PostgreSQL", "MySQL", "SQLite"];

function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground ${className}`}
    >
      <SparklesIcon size={18} />
    </span>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Floating nav ── */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <div className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between rounded-full border border-border bg-card/80 py-2 pl-3 pr-2 shadow-sm backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold tracking-tight">Natural QL</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
            <a href={USER_GUIDE_URL} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Docs
            </a>
            <a href={GITHUB_URL} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              GitHub
            </a>
          </nav>
          <Link
            href="/app"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open app
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-40 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <SparklesIcon size={13} />
            AI database agent
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Ask your database anything
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Connect Postgres, MySQL, or SQLite and ask questions in plain English.
            Natural QL drafts validated, read-only SQL with AI, and nothing runs
            until you approve it.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/app"
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </div>

          {/* ── Product preview ── */}
          <div className="mt-16 w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <div className="flex items-center gap-1.5 border-b border-border px-5 py-3.5">
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="ml-3 text-xs text-muted-foreground">Natural QL</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/natural-ql.gif"
              alt="Natural QL turning a plain-English question into validated, read-only SQL and results"
              className="block w-full"
            />
          </div>
        </section>

        {/* ── Works with ── */}
        <section className="border-y border-border">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-7 px-6 py-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Works with the databases you already run
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
              {databases.map((db) => (
                <span key={db} className="text-xl font-semibold tracking-tight text-foreground/70">
                  {db}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-5xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Powerful by default, safe by design
            </h2>
            <p className="mt-4 text-balance text-muted-foreground">
              Natural QL pairs AI-drafted SQL with hard guardrails and an approval gate,
              so you move fast without handing the keys to a model.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <feature.icon size={18} />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                From question to answer in three steps
              </h2>
              <p className="mt-4 text-balance text-muted-foreground">
                A user-in-the-loop flow that keeps you in control the whole way through.
              </p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.step} className="rounded-2xl border border-border bg-card p-7">
                  <span className="font-mono text-sm text-muted-foreground">{step.step}</span>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Talk to your database in plain English
            </h2>
            <p className="max-w-xl text-balance text-primary-foreground/70">
              Connect a database, ask a question, and approve the SQL. Read-only and
              guarded, every step of the way.
            </p>
            <Link
              href="/app"
              className="rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
            >
              Open Natural QL
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <Logo />
                <span className="text-sm font-semibold tracking-tight">Natural QL</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                An AI database agent. Ask real databases questions in plain English.
                Read-only and approval-gated.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product</h4>
                <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
                <a href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
                <Link href="/app" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Open app</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Docs</h4>
                <a href={USER_GUIDE_URL} className="text-sm text-muted-foreground transition-colors hover:text-foreground">User Guide</a>
                <a href={DEV_DOCS_URL} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Developer Docs</a>
                <a href={DEMO_URL} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Demo video</a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Project</h4>
                <a href={GITHUB_URL} className="text-sm text-muted-foreground transition-colors hover:text-foreground">GitHub</a>
                <a href={`${GITHUB_URL}/blob/main/LICENSE`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">License</a>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
            <p className="text-sm text-muted-foreground">© 2026 Natural QL</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              Read-only by design
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
