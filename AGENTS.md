<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Natural QL

Single-pkg Next.js 16 app (App Router). Guarded MCP SQL copilot — chat UI, AI-drafted SQL, Postgres parser validation, approval-gated execution.

## Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Next.js dev server |
| `pnpm lint` | ESLint (flat config, `eslint.config.mjs`) |
| `pnpm test` | Vitest on `**/*.test.ts` (node env) |
| `pnpm build` | Production build |

No standalone typecheck script — use `npx tsc --noEmit`.

## Key conventions

- **Path alias** `@/*` maps to project root (tsconfig paths).
- **API routes** (`app/api/`) return `ApiResponse<T>` discriminated union. Error responses use `satisfies ApiResponse<never>` for type safety.
- **Zod** for all schemas — API request validation, query types (`lib/types/query.ts`), chat message types (`lib/types/chat.ts`).
- **CSS design system** in `app/globals.css`: oklch custom properties (`--background`, `--primary`, `--success`, etc.), no Tailwind classes in component files (check to confirm).
- **No external icon or component library.** Icons are inline SVGs in `components/chat/icons.tsx`.
- **`cn()` utility** (`lib/utils.ts`) is simple `filter(Boolean).join(" ")` — not clsx/twMerge.

## Architecture quirks

- **`pgsql-parser`** is a native Node addon. Must stay in `next.config.ts` → `serverExternalPackages`.
- **Serverless-friendly**: Browser holds MCP credentials per session and sends them with each request. No server-side connection state.
- **No monorepo** despite `pnpm-workspace.yaml` — that file only declares `ignoredBuiltDependencies`.

## Env

- `OPENAI_API_KEY` — required for AI draft/explain endpoints.
- `OPENAI_MODEL` — optional, defaults to `gpt-5.4-mini`.

## Testing

- Vitest, node env, matches `**/*.test.ts`.
- Tests live alongside source in `lib/`. Currently covers: endpoint validation, SQL guardrails, AI Zod schemas.
- No E2E or component tests yet.
