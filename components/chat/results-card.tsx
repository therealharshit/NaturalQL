"use client";

import { useState } from "react";
import type { QueryResult, ResultExplanation } from "@/lib/types/query";
import { formatCell, cn } from "@/lib/utils";
import { ChevronDownIcon, TableIcon } from "./icons";

type ResultsCardProps = {
  sql: string;
  result: QueryResult;
  explanation: ResultExplanation;
  statusText: string;
};

export function ResultsCard({
  sql,
  result,
  explanation,
  statusText,
}: ResultsCardProps) {
  const [tableExpanded, setTableExpanded] = useState(result.rows.length <= 10);

  return (
    <div className="animate-message-in space-y-4">
      {/* Explanation card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[0.9375rem] font-medium leading-relaxed text-foreground">
          {explanation.summary}
        </p>

        {explanation.findings.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {explanation.findings.map((finding) => (
              <li
                key={finding}
                className="flex gap-2.5 text-sm text-muted-foreground"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-success" />
                {finding}
              </li>
            ))}
          </ul>
        )}

        {explanation.caveats.length > 0 && (
          <div className="mt-4 rounded-xl bg-warning/5 border border-warning/20 px-4 py-3">
            <p className="text-xs font-medium text-warning mb-1">Caveats</p>
            <p className="text-xs text-muted-foreground">
              {explanation.caveats.join(" ")}
            </p>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">{statusText}</p>
      </div>

      {/* Results table */}
      {result.rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/50 px-5 py-4 text-sm text-muted-foreground">
          The query ran successfully but returned no rows.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Table header */}
          <button
            onClick={() => setTableExpanded(!tableExpanded)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-sm transition-colors hover:bg-accent/50"
          >
            <span className="flex items-center gap-2 font-medium text-foreground">
              <TableIcon size={14} className="text-muted-foreground" />
              {result.rowCount} rows · {result.columns.length} columns
              {result.truncated && (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                  truncated
                </span>
              )}
            </span>
            <ChevronDownIcon
              size={14}
              className={cn(
                "text-muted-foreground transition-transform",
                tableExpanded && "rotate-180",
              )}
            />
          </button>

          {tableExpanded && (
            <div className="overflow-x-auto border-t border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-accent/30"
                    >
                      {result.columns.map((col) => (
                        <td
                          key={col}
                          className="whitespace-nowrap px-4 py-2.5 text-foreground font-mono text-xs"
                        >
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
