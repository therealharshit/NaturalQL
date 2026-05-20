# Natural QL Developer Docs

Natural QL is a Next.js 16 app that connects to remote HTTP MCP servers, drafts SQL with structured AI output, validates SQL with a Postgres parser, and executes only approval-gated read-only queries.

## Architecture

```text
Browser UI
  |
  | MCP endpoint + bearer token
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

Question flow
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
Approval UI
  |
  v
app/api/query/execute/route.ts
  |
  | revalidate SQL, execute via allowed MCP query tool, explain results
  v
Table + explanation
```

## Key Files

- `components/analyst-workspace.tsx` — client-side connection, question, approval, and result UI.
- `app/api/mcp/connect/route.ts` — remote MCP endpoint validation and schema snapshot loading.
- `app/api/query/draft/route.ts` — structured SQL draft generation and validation preview.
- `app/api/query/execute/route.ts` — approval-gated execution and result explanation.
- `lib/mcp/validate-endpoint.ts` — HTTPS, DNS, private-network, redirect, and timeout guardrails.
- `lib/mcp/tools.ts` — MCP SDK client wrapper, tool discovery, schema loading, and query execution.
- `lib/sql/validate-readonly.ts` — parser-backed Postgres read-only validation.
- `lib/ai/draft-query.ts` — OpenAI structured output for SQL drafts.
- `lib/ai/explain-results.ts` — OpenAI structured output for result explanations.
- `lib/types/query.ts` — shared Zod schemas and TypeScript types.

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
