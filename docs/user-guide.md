# Natural QL User Guide

Natural QL lets you ask questions about your database without writing SQL. It connects directly to your PostgreSQL, MySQL, or SQLite database, drafts a read-only SQL query using Gemini AI, shows you the query for review, and runs it after you approve.

## Setup & Configuration

Before running Natural QL, ensure you have a Google Gemini API key configured:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the application:
```bash
pnpm dev
```
Open `http://localhost:3000` in your web browser.

## Connecting a Database

1. Click the **Connect Database** button in the top-right of the header.
2. Select your database type from the tab selector:
   - **PostgreSQL**: Enter the host, port (default 5432), user, password, and database name.
   - **MySQL**: Enter the host, port (default 3306), user, password, and database name.
   - **SQLite**: Enter the absolute filesystem path to your SQLite database file.
3. Click **Connect**. The system will introspect the database to discover tables and columns, then save the schema snapshot locally in your browser session.

## Asking Questions

Type your question in natural language in the chat input at the bottom of the screen. Examples:
- "Show me the top 5 customers by revenue"
- "How many active users signed up in the last month?"
- "What is the average price of products?"

You can also click one of the suggested query cards on the greeting screen to pre-fill a question.

## Reviewing & Running SQL

When you submit a question:
1. Gemini AI drafts a SQL query tailored to your database dialect and schema.
2. A **SQL Card** appears in the chat containing:
   - **Confidence Score**: How confident the model is in its query.
   - **SQL Preview**: The drafted query syntax.
   - **Validation Status**: A green "Validated" badge means it passed read-only and safety checks.
   - **Details Accordion**: Collapsible list of referenced tables, assumptions, and caveats.
3. Click **Approve & Run** to execute the query.

## Viewing Results

Once approved and executed, a **Results Card** is shown in the chat:
1. **AI Explanation**: A plain-English summary of what the data shows, key insights, and potential caveats.
2. **Data Table**: A collapsible table displaying the raw query results (capped at 100 rows for safety and performance).
