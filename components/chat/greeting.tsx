"use client";

import { SparklesIcon, DatabaseIcon, TableIcon, ShieldIcon } from "./icons";

type GreetingProps = {
  onSuggestionClick: (text: string) => void;
};

const suggestions = [
  {
    title: "Top customers",
    description: "by revenue last month",
    text: "Show me the top 5 customers by revenue last month",
  },
  {
    title: "New signups",
    description: "this week's count",
    text: "How many new accounts signed up this week?",
  },
  {
    title: "Order trends",
    description: "monthly breakdown",
    text: "Show me a breakdown of orders by month for the last 6 months",
  },
  {
    title: "Largest invoices",
    description: "top 10 by amount",
    text: "Which invoices had the largest amounts this quarter?",
  },
];

export function Greeting({ onSuggestionClick }: GreetingProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      {/* Logo / sparkle */}
      <div
        className="animate-fade-in mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg"
        style={{ animationDelay: "0.1s" }}
      >
        <SparklesIcon size={26} />
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-in text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        style={{ animationDelay: "0.2s" }}
      >
        Ask your database anything
      </h1>
      <p
        className="animate-fade-in mt-3 max-w-md text-center text-muted-foreground"
        style={{ animationDelay: "0.3s" }}
      >
        Connect to a database, ask questions in plain English,
        and get validated SQL with results.
      </p>

      {/* Safety badges */}
      <div
        className="animate-fade-in mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground"
        style={{ animationDelay: "0.4s" }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <ShieldIcon size={12} />
          Read-only SQL
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <DatabaseIcon size={12} />
          HTTPS only
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          <TableIcon size={12} />
          Approval required
        </span>
      </div>

      {/* Suggested actions */}
      <div
        className="animate-fade-in mt-10 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2"
        style={{ animationDelay: "0.5s" }}
      >
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.text}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="group flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-ring/40 hover:bg-accent hover:shadow-sm"
          >
            <span className="text-sm font-medium text-foreground group-hover:text-foreground">
              {suggestion.title}
            </span>
            <span className="mt-0.5 text-xs text-muted-foreground">
              {suggestion.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
