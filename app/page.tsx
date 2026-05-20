import { AnalystWorkspace } from "@/components/analyst-workspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fde68a,transparent_32%),linear-gradient(135deg,#f8f4ea_0%,#e7ded0_45%,#d8e2dc_100%)] px-5 py-8 text-stone-950 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[2.5rem] border border-stone-300 bg-white/70 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
            Natural QL
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-stone-950 sm:text-7xl">
                Ask your database like a founder asks an analyst.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
                Connect a remote MCP database server, draft Postgres SQL from a
                business question, review the query, then run only validated
                read-only SQL.
              </p>
            </div>
            <div className="rounded-[2rem] bg-stone-950 p-5 text-stone-100">
              <p className="text-sm font-semibold text-amber-200">
                Safety model
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
                <li>HTTPS-only remote MCP endpoints</li>
                <li>Private network and metadata IP blocking</li>
                <li>Parser-backed read-only SQL validation</li>
                <li>Approval required before query execution</li>
              </ul>
            </div>
          </div>
        </section>
        <AnalystWorkspace />
      </div>
    </main>
  );
}
