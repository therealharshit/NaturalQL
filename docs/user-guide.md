# Natural QL User Guide

Natural QL lets you ask questions about your database without writing SQL. It connects to your database through a remote MCP server, drafts a read-only SQL query, shows you the query, and only runs it after you approve.

## What You Need

- A remote HTTPS MCP server that can talk to your database.
- The MCP server should expose tools for table/schema discovery and read-only SQL execution.
- Your database credentials behind the MCP server should be read-only.
- An OpenAI API key configured on the Natural QL deployment.

## Connect A Database

1. Open Natural QL.
2. Enter your remote MCP endpoint URL, for example `https://mcp.example.com/mcp`.
3. Enter a bearer token if your MCP server requires one.
4. Click **Connect safely**.

Natural QL validates the endpoint before connecting. It rejects local, private-network, link-local, and cloud metadata addresses.

## Ask A Question

Type a business question like:

- `Show me the top 5 customers by revenue last month`
- `How many new accounts signed up this week?`
- `Which accounts had the most invoices in the last quarter?`

Natural QL reads the schema snapshot from your MCP server and asks the AI model to return a structured SQL draft.

## Review Before Running

Natural QL shows the generated SQL before execution. Review:

- The SQL itself.
- The tables referenced.
- The assumptions and caveats.
- Whether the query matches what you intended to ask.

Click **Approve and run** only if the SQL looks right.

## Guardrails

Natural QL blocks unsafe queries before they reach your database.

- It allows a single `SELECT` statement only.
- It blocks `INSERT`, `UPDATE`, `DELETE`, schema changes, transactions, procedures, temp table writes, and unsafe functions.
- It adds/enforces row limits.
- It requires approval before execution.

You should still connect through a read-only database user. Application guardrails reduce risk, but database permissions are the final backstop.

## Results

After approval, Natural QL runs the query through the MCP server and shows:

- A result table.
- A plain-English summary.
- Key findings.
- Caveats, including uncertainty from the draft or result.

## Common Errors

- **Remote MCP endpoints must use HTTPS**: use an HTTPS MCP server URL.
- **Endpoint resolves to a blocked network address**: the endpoint points to localhost, a private network, or a protected metadata IP.
- **MCP server must expose table/schema discovery and read-only query tools**: configure the MCP server with schema and query tools.
- **OPENAI_API_KEY is required**: configure the deployment environment.
- **Only read-only SELECT queries are allowed**: the generated SQL was blocked and not run.

## Current Limits

- Postgres SQL validation is the first target.
- MCP connection settings are held in the browser session and sent with each request.
- Saved metric definitions, dashboards, charts, user accounts, and team workspaces are not in v1.
