# Natural QL Developer Docs

Natural QL is a Next.js 16 app that connects directly to PostgreSQL, MySQL, and SQLite databases, drafts SQL using Google Gemini structured AI outputs, validates queries for read-only safety, and executes them with user approval. The frontend is a conversational chat UI.

## Architecture

```text
Browser Chat UI
  |
  | db connection configuration (via connect dialog)
  v
app/api/connect/route.ts
  |
  | validate params, connect and introspect schema, return snapshot
  v
Target Database (PostgreSQL / MySQL / SQLite)

Question flow (chat message → API → chat response)
  |
  v
app/api/query/draft/route.ts
  |
  | schema snapshot + user question + db type
  v
lib/ai/draft-query.ts (Gemini AI)
  |
  | typed structured SQL query draft
  v
lib/sql/validate-readonly.ts
  |
  | parser-backed SQL safety check
  v
Approval UI (SQL card in chat thread)
  |
  v
app/api/query/execute/route.ts
  |
  | revalidate SQL, execute via adapter, explain results with Gemini
  v
Results card in chat thread (results table + plain English insights)
```

## Key Files

### Frontend Components

- `components/chat/chat-shell.tsx` — Main orchestrator. Manages connection state, conversation messages, and the ask → draft → approve → execute flow.
- `components/chat/chat-header.tsx` — Header bar with database name pill and connection status.
- `components/chat/chat-messages.tsx` — Scrollable message container with auto-scroll-to-bottom.
- `components/chat/chat-input.tsx` — Textarea pinned to viewport bottom.
- `components/chat/message.tsx` — Discriminated union renderer dispatching to role-specific sub-components.
- `components/chat/connect-dialog.tsx` — Modal dialog for database connection settings (Postgres/MySQL credentials or SQLite path).
- `components/chat/sql-card.tsx` — SQL draft card: confidence badge, validation status, code block, assumptions, caveats, and approve button.
- `components/chat/results-card.tsx` — Results card: AI explanation (summary, findings, caveats), collapsible data table.
- `components/chat/icons.tsx` — SVG icon components.

### Database Adapters

- `lib/db/types.ts` — `DbAdapter` interface defining `connect`, `introspect`, `execute`, and `disconnect` contracts.
- `lib/db/postgres.ts` — PostgreSQL implementation using `pg.Client`.
- `lib/db/mysql.ts` — MySQL implementation using `mysql2/promise`.
- `lib/db/sqlite.ts` — SQLite implementation using `better-sqlite3` in read-only mode.
- `lib/db/index.ts` — Factory method `createAdapter(connection)` returning the corresponding adapter.

### Shared Utilities & Core Logic

- `lib/utils.ts` — classnames merger `cn()`, API utility `postJson()`.
- `lib/types/query.ts` — Shared Zod schemas for database configurations, API schemas, and validation types.
- `lib/types/chat.ts` — Chat message type definitions.
- `lib/sql/validate-readonly.ts` — PostgreSQL AST-based parser (`pgsql-parser`) and MySQL/SQLite keyword-based read-only validator.
- `lib/ai/draft-query.ts` — Gemini AI structured output client for drafting SQL queries.
- `lib/ai/explain-results.ts` — Gemini AI structured output client for explaining query results.

## Environment Variables

```bash
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

- `GEMINI_API_KEY`: Required for drafting SQL queries and generating result explanations.
- `GEMINI_MODEL`: Optional. Defaults to `gemini-2.5-flash`.

## SQL Validation Guardrails

`validateReadOnlySql` enforces that only safe, read-only queries are executed:
- For **PostgreSQL**: Leverages `pgsql-parser` to parse the statement AST. It rejects multiple statements, non-`SELECT` statements, `SELECT INTO`, transactions, and unsafe system functions (e.g., `pg_sleep`, backend signaling).
- For **MySQL** and **SQLite**: Uses keyword-based validation to reject write keywords (e.g., `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `REPLACE`, `RENAME`, `TRUNCATE`, `GRANT`).
- Appends `LIMIT 100` to the SQL query if no limit is specified.

The execute route re-validates the SQL at the enforcement point to guarantee security.

## Testing

We use Vitest to run the test suite:
```bash
pnpm test
```

Vitest covers read-only SQL validation rules across all three supported dialects (PostgreSQL, MySQL, SQLite).
