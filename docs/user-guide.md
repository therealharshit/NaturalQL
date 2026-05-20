# Natural QL User Guide

Natural QL lets you ask questions about your database without writing SQL. It connects to your database through a remote MCP server, drafts a read-only SQL query, shows you the query, and only runs it after you approve — all through a chat-style conversational interface.

## What You Need

- A remote HTTPS MCP server that can talk to your database.
- The MCP server should expose tools for table/schema discovery and read-only SQL execution.
- Your database credentials behind the MCP server should be read-only.
- An OpenAI API key configured on the Natural QL deployment.

## The Interface

Natural QL uses a full-screen chat interface with three main areas:

1. **Header bar** — Shows the Natural QL brand and a connection status button. When connected, the button shows a green dot and the number of tables discovered.
2. **Chat area** — A scrollable message thread where your questions, SQL drafts, approval buttons, and query results appear in order. When empty, a greeting screen with suggested questions is displayed.
3. **Chat input** — A text input at the bottom of the screen. Type your question and press Enter (or click the send button) to submit.

## Connect A Database

1. Open Natural QL.
2. Click the **Connect database** button in the top-right header.
3. Enter your remote MCP endpoint URL, for example `https://mcp.example.com/mcp`.
4. Enter a bearer token if your MCP server requires one.
5. Click **Connect safely**.

A system message confirming the connection and number of tables discovered will appear in the chat.

Natural QL validates the endpoint before connecting. It rejects local, private-network, link-local, and cloud metadata addresses.

## Ask A Question

Type a business question in the chat input at the bottom of the screen. Examples:

- `Show me the top 5 customers by revenue last month`
- `How many new accounts signed up this week?`
- `Which accounts had the most invoices in the last quarter?`

You can also click one of the **suggested question cards** shown on the greeting screen to pre-fill a question.

Natural QL reads the schema snapshot from your MCP server and asks the AI model to return a structured SQL draft.

## Review Before Running

The AI response appears as a **SQL card** in the chat thread. Review:

- The **confidence score** — shown as a percentage badge.
- The **SQL itself** — syntax-highlighted in a dark code block.
- The **validation status** — a green "Validated" badge means it passed parser-backed safety checks.
- The **tables, assumptions, and caveats** — expand the details section for more context.
- Whether the query matches what you intended to ask.

Click **Approve & Run** only if the SQL looks right. You can also copy the SQL using the copy button.

## Guardrails

Natural QL blocks unsafe queries before they reach your database.

- It allows a single `SELECT` statement only.
- It blocks `INSERT`, `UPDATE`, `DELETE`, schema changes, transactions, procedures, temp table writes, and unsafe functions.
- It adds/enforces row limits.
- It requires approval before execution.

You should still connect through a read-only database user. Application guardrails reduce risk, but database permissions are the final backstop.

## Results

After approval, Natural QL runs the query through the MCP server and shows a **results card** in the chat:

- A **plain-English summary** of what the data shows.
- **Key findings** as a bulleted list.
- **Caveats** about data uncertainty.
- A **collapsible data table** with the raw query results.
- A **row count** and truncation indicator if the results were capped.

## Common Errors

- **Connect to a database first** — click the connection button in the header before asking questions.
- **Remote MCP endpoints must use HTTPS** — use an HTTPS MCP server URL.
- **Endpoint resolves to a blocked network address** — the endpoint points to localhost, a private network, or a protected metadata IP.
- **MCP server must expose table/schema discovery and read-only query tools** — configure the MCP server with schema and query tools.
- **OPENAI_API_KEY is required** — configure the deployment environment.
- **Only read-only SELECT queries are allowed** — the generated SQL was blocked and not run.

## Current Limits

- Postgres SQL validation is the first target.
- MCP connection settings are held in the browser session and sent with each request.
- Saved metric definitions, dashboards, charts, user accounts, and team workspaces are not in v1.
- Chat history is not persisted between page refreshes.
