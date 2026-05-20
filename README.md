# Natural QL

Natural QL is a guarded MCP SQL copilot for real databases. A user connects a remote database MCP server, asks a business question in plain English, reviews the generated SQL, approves execution, and gets a table plus a plain-English explanation — all through a conversational chat interface.

The v1 product is intentionally narrow: remote HTTP MCP, Postgres-style read-only SQL, explicit user approval, and parser-backed guardrails.

## Docs

- [User guide](docs/user-guide.md) — how end users connect an MCP server, ask questions, approve SQL, and read results.
- [Developer docs](docs/developer-docs.md) — architecture, UI components, API routes, guardrails, environment variables, testing, and implementation details.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

To draft and explain queries, configure:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5.4-mini
```

`OPENAI_MODEL` is optional. If unset, the app uses `gpt-5.4-mini`.

## UI

Natural QL uses a full-screen chat interface inspired by modern AI assistants:

- **Chat input** at the bottom — type natural language questions.
- **Message thread** in the center — user questions, AI-drafted SQL cards, approval buttons, and query results all appear in a conversational flow.
- **Connection dialog** in the header — connect your MCP database server via a modal.
- **Greeting screen** — suggested queries shown when no conversation has started.

## Safety Model

Natural QL does not trust model output. The backend validates every remote MCP endpoint and every SQL statement before execution.

- Remote MCP endpoints must use HTTPS.
- Hostnames are DNS-resolved and blocked if they point at localhost, private networks, link-local ranges, or cloud metadata IPs.
- MCP redirects to blocked addresses are rejected.
- SQL is parsed with a Postgres parser, not regex-only checks.
- Only one read-only `SELECT` statement is allowed.
- Mutations, DDL, transactions, stored procedures, temp table writes, and unsafe functions are blocked.
- Query execution requires explicit user approval.

## Scripts

```bash
pnpm dev       # start Next.js dev server
pnpm lint      # run ESLint
pnpm test      # run Vitest
pnpm build     # production build
```

## Status

This is an early v1 implementation. It is designed for real remote MCP database servers, but it is not yet a full multi-tenant SaaS. Authentication, account persistence, team workspaces, charts, saved metrics, and Playwright E2E coverage are intentionally deferred.
