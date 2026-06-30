<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Natural QL

Single-pkg Next.js 16 app (App Router). An AI database agent: connect a Postgres/MySQL/SQLite database, ask in plain English, Google Gemini drafts SQL, the SQL is validated read-only and shown for approval, then it runs and results come back with an AI summary.

- `/` — marketing landing page (`components/landing/`).
- `/app` — the chat copilot (`components/chat/ChatShell`). This is the product.

## Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Next.js dev server (localhost:3000) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (flat config, `eslint.config.mjs`) |
| `pnpm test` | Vitest, runs once (`vitest run`) on `**/*.test.ts`, node env |

No standalone typecheck script — use `npx tsc --noEmit`. Single test: `pnpm vitest run lib/sql/validate-readonly.test.ts`, or filter by name with `-t "pattern"`. pnpm is the package manager.

## Env

- `GEMINI_API_KEY` — required for all AI features (draft + explain).
- `GEMINI_MODEL` — optional, defaults to `gemini-2.5-flash`.

AI runs through `@google/genai`.

## Architecture: the guarded query flow

The app is a human-in-the-loop, defense-in-depth pipeline. Three API routes under `app/api/`, all stateless:

1. **`/api/connect`** — opens an adapter, introspects the schema, returns a `SchemaSnapshot`.
2. **`/api/query/draft`** — sends question + schema to Gemini (`lib/ai/draft-query.ts`), then validates the draft read-only *before returning it*. Returns `{ draft, safeSql, validationError }`.
3. **`/api/query/execute`** — **re-validates the SQL at the enforcement point** (the user may have edited it), runs it, caps rows, then best-effort calls `lib/ai/explain-results.ts` for the summary (failure there doesn't fail the request).

Validation runs at both draft and execute on purpose — never assume an incoming SQL string is safe because the model drafted it. `ChatShell` orchestrates client-side: it holds the connection + schema in refs and `postJson`s to each route in sequence.

**Credential model**: no server-side connection state. The browser holds the DB credentials for the session and sends them with every request. Keep each API route fully self-contained — no server-held connections or caches.

**SQL guardrail** (`lib/sql/validate-readonly.ts`): the security core. Postgres uses `pgsql-parser` for AST-level validation; MySQL/SQLite use keyword checks. Rejects write/DDL statements, unsafe Postgres functions, and multiple statements; caps results at `MAX_ROWS = 100`; returns `normalizedSql`. This file holds the only test suite — keep it covered when changing safety logic.

**Database adapters** (`lib/db/`): `createAdapter(connection)` (in `lib/db/index.ts`) returns a `DbAdapter` (`connect` / `introspect` / `execute` / `disconnect`) implemented per driver in `postgres.ts`, `mysql.ts`, `sqlite.ts`. Add a database by implementing `DbAdapter` and wiring it into the factory.

## Key conventions

- **Path alias** `@/*` maps to project root (tsconfig paths).
- **API routes** return the `ApiResponse<T>` discriminated union (`lib/types/query.ts`): success `{ ok: true, ... }`, errors `{ ok: false, code, message }` written with `satisfies ApiResponse<never>`. `code` values include `INVALID_INPUT`, `UNSAFE_SQL`, `QUERY_FAILED`.
- **Zod** for all schemas — request bodies (`DraftRequestSchema`, `ExecuteRequestSchema`), query types (`lib/types/query.ts`), chat messages (`lib/types/chat.ts`). Parse with `safeParse` at route entry.
- **Styling**: Tailwind v4, CSS-first. Tokens are oklch CSS variables in `app/globals.css` (`--primary`, `--success`, `--warning`, `--destructive`, `--muted-foreground`, …) exposed via `@theme inline`. Components use Tailwind utility classes directly.
- **`cn()` utility** (`lib/utils.ts`) is a plain `filter(Boolean).join(" ")` — not clsx/twMerge.
- **No external icon or component library.** Icons are hand-written inline SVGs in `components/chat/icons.tsx`.
- **Chat history**: `lib/hooks/use-chat-history.ts` persists multi-conversation state to `localStorage`; client-only.

## Architecture quirks

- **Native packages**: `pgsql-parser`, `libpg-query`, `better-sqlite3`, `mysql2`, and `pg` must stay in `next.config.ts` → `serverExternalPackages`.
- **No monorepo** despite `pnpm-workspace.yaml` — that file only declares `ignoredBuiltDependencies`.

## Testing

- Vitest, node env, matches `**/*.test.ts`. Tests live alongside source in `lib/` (currently the SQL guardrail). No E2E or component tests yet.
