# Natural QL Developer Docs

Natural QL is a Next.js 16 app that connects to remote HTTP MCP servers, drafts SQL with structured AI output, validates SQL with a Postgres parser, and executes only approval-gated read-only queries. The frontend is a conversational chat UI.

## Architecture

```text
Browser Chat UI
  |
  | MCP endpoint + bearer token (via connect dialog)
  v
app/api/mcp/connect/route.ts
  |
  | validate endpoint, inspect MCP tools, load schema snapshot
  v
Remote MCP Server
  |
  | schema/query tools
  v
Read-only database

Question flow (chat message → API → chat response)
  |
  v
app/api/query/draft/route.ts
  |
  | schema snapshot + user question
  v
lib/ai/draft-query.ts
  |
  | typed structured output
  v
lib/sql/validate-readonly.ts
  |
  | parser-backed SQL safety result
  v
Approval UI (SQL card in chat thread)
  |
  v
app/api/query/execute/route.ts
  |
  | revalidate SQL, execute via allowed MCP query tool, explain results
  v
Results card in chat thread
```

## Key Files

### Frontend Components

- `components/chat/chat-shell.tsx` — Main orchestrator. Manages connection, conversation messages, and the ask → draft → approve → execute flow.
- `components/chat/chat-header.tsx` — Header bar with brand logo and connection status pill.
- `components/chat/chat-messages.tsx` — Scrollable message container with auto-scroll-to-bottom.
- `components/chat/chat-input.tsx` — Auto-resizing textarea pinned to viewport bottom.
- `components/chat/message.tsx` — Discriminated union renderer dispatching to role-specific sub-components.
- `components/chat/greeting.tsx` — Empty state with suggested question cards.
- `components/chat/connect-dialog.tsx` — Modal dialog for MCP connection settings.
- `components/chat/sql-card.tsx` — SQL draft card: confidence badge, validation status, code block, expandable details, approve button.
- `components/chat/results-card.tsx` — Results card: AI explanation, findings, caveats, collapsible data table.
- `components/chat/icons.tsx` — SVG icon components (no external icon library).

### Shared Utilities

- `lib/utils.ts` — `cn()` for class merging, `postJson()` for API calls, `formatCell()` for table display.
- `lib/types/chat.ts` — Discriminated union types for all chat message variants (`UserMessage`, `AssistantDraftMessage`, `AssistantResultMessage`, etc.).

### Backend (unchanged from v1)

- `app/api/mcp/connect/route.ts` — Remote MCP endpoint validation and schema snapshot loading.
- `app/api/query/draft/route.ts` — Structured SQL draft generation and validation preview.
- `app/api/query/execute/route.ts` — Approval-gated execution and result explanation.
- `lib/mcp/validate-endpoint.ts` — HTTPS, DNS, private-network, redirect, and timeout guardrails.
- `lib/mcp/tools.ts` — MCP SDK client wrapper, tool discovery, schema loading, and query execution.
- `lib/sql/validate-readonly.ts` — Parser-backed Postgres read-only validation.
- `lib/ai/draft-query.ts` — OpenAI structured output for SQL drafts.
- `lib/ai/explain-results.ts` — OpenAI structured output for result explanations.
- `lib/types/query.ts` — Shared Zod schemas and TypeScript types.

### App Shell

- `app/layout.tsx` — Root layout with Inter font (via `next/font/google`) and full-height body.
- `app/globals.css` — Design system: CSS custom properties (oklch colors), keyframe animations, scrollbar styling, dialog overlay utilities.
- `app/page.tsx` — Renders `<ChatShell />`.

## UI Component Architecture

The chat UI follows a discriminated union pattern for message rendering:

```text
ChatShell (state orchestrator)
├── ChatHeader (brand + connection status)
├── ChatMessages (scrollable container)
│   ├── Greeting (empty state, shown when messages = [])
│   │   └── suggestion cards
│   └── Message[] (rendered per message)
│       ├── UserBubble (right-aligned dark bubble)
│       ├── ThinkingIndicator (animated dots)
│       ├── SqlCard (draft + approve)
│       ├── ResultsCard (table + explanation)
│       ├── SystemBubble (centered status pill)
│       └── ErrorBubble (left-aligned warning)
├── ChatInput (textarea + send/stop button)
└── ConnectDialog (modal overlay, conditional)
```

### Message Type System

All conversation state uses `ChatMessage` from `lib/types/chat.ts` — a discriminated union keyed on `role` and `type`:

```ts
type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; type: "thinking" }
  | { role: "assistant"; type: "draft"; draft: QueryDraft; safeSql: string }
  | { role: "assistant"; type: "result"; result: QueryResult; explanation: ResultExplanation }
  | { role: "assistant"; type: "error"; message: string }
  | { role: "system"; content: string }
```

### Design System

The CSS design system uses oklch color tokens defined as CSS custom properties. Key tokens:

| Token | Purpose |
|-------|---------|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--card` | Card/surface background |
| `--muted` / `--muted-foreground` | Secondary surfaces/text |
| `--border` | Borders |
| `--primary` / `--primary-foreground` | Primary actions (buttons, user bubbles) |
| `--success` | Connected state, validation passed |
| `--warning` | Caveats, medium confidence |
| `--destructive` | Errors, validation failures |

Animation classes: `animate-message-in`, `animate-fade-in`, `animate-scale-in`, `thinking-dot`.

## Environment Variables

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
```

`OPENAI_API_KEY` is required for `/api/query/draft` and `/api/query/execute`. `OPENAI_MODEL` is optional.

## MCP Requirements

Natural QL expects a remote HTTPS MCP server with tools that can be detected from names/descriptions:

- Table/schema listing tool: name or description matching `list tables` or `schema`.
- Optional table description tool: matching `describe table` or `table schema`.
- Read-only query tool: matching `query`, `execute sql`, or `read sql`.

The current implementation sends broad argument shapes for compatibility:

- Describe table: `{ table, tableName }`
- Query: `{ sql, query, maxRows }`

If your MCP server uses different tool names or arguments, update `lib/mcp/tools.ts`.

## Endpoint Guardrails

`validateRemoteMcpEndpoint` enforces:

- Valid URL.
- `https:` protocol only.
- No username/password in the URL.
- DNS resolution before outbound calls.
- Blocking localhost, private IPv4 ranges, link-local ranges, multicast/reserved ranges, IPv6 loopback/private/link-local ranges, and cloud metadata IPs.
- Manual redirect handling in `guardedFetch` so redirects to unsafe targets are blocked.
- Request timeout.

This protects the hosted app from SSRF, where a user-provided URL tricks the server into calling internal infrastructure.

## SQL Guardrails

`validateReadOnlySql` uses `pgsql-parser` to parse Postgres SQL. It rejects:

- Empty SQL.
- Parse errors.
- Multiple statements.
- Non-`SELECT` statements.
- `SELECT INTO`.
- Unsafe functions including `pg_sleep`, advisory locks, `dblink`, and backend termination functions.

It returns:

- `normalizedSql`: original SQL with a default `LIMIT` appended when absent.
- `tablesReferenced`: tables discovered from the parsed AST.

The execute route revalidates SQL even if the draft route already validated it. Draft validation is for preview; execute validation is the enforcement point.

## AI Contracts

SQL drafts must match `QueryDraftSchema`:

```ts
{
  needsClarification: boolean
  clarifyingQuestion: string | null
  sql: string | null
  tablesReferenced: string[]
  assumptions: string[]
  caveats: string[]
  confidence: number
  explanationPlan: string
}
```

Result explanations must match `ResultExplanationSchema`:

```ts
{
  summary: string
  findings: string[]
  caveats: string[]
}
```

Do not parse SQL out of markdown. Keep model boundaries structured and validated.

## Testing

Current test stack:

```bash
pnpm test
```

Vitest covers:

- Remote MCP endpoint validation.
- Private-network and metadata IP blocking.
- Postgres read-only SQL validation.
- Structured AI draft schema.
- Structured result explanation schema.

Still needed:

- Unit tests for `lib/mcp/tools.ts` with mocked MCP clients.
- Route tests for invalid input and blocked SQL.
- Deterministic eval fixtures for at least five founder/operator questions against a seeded SaaS schema.
- Playwright E2E after the UI flow stabilizes.

## Development Commands

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
```

Before coding against Next.js APIs, read the matching local docs under `node_modules/next/dist/docs/`. This repo uses Next.js 16, which has breaking changes from older versions.

## Deployment Notes

The app is deployable as a web service, but v1 intentionally avoids server-side in-memory connection state. The browser holds endpoint/token values for the session and sends them to API routes. That keeps the flow compatible with serverless deployments.

For a production multi-user SaaS, add:

- User authentication.
- Encrypted connection storage.
- Per-user/workspace MCP endpoint allowlists.
- Audit logs.
- Rate limits.
- Playwright smoke tests against a staging MCP server.
