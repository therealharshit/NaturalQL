"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mermaid } from "./mermaid";

/** Flatten React children to plain text (for heading anchor slugs). */
function toText(node: ReactNode): string {
  if (node === null || node === undefined || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (typeof node === "object" && "props" in node) {
    return toText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-3 mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            id={slugify(toText(children))}
            className="mb-3 mt-12 scroll-mt-24 border-t border-border pt-8 text-2xl font-semibold tracking-tight text-foreground"
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            id={slugify(toText(children))}
            className="mb-2 mt-8 scroll-mt-24 text-lg font-semibold tracking-tight text-foreground"
          >
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="my-4 leading-relaxed text-muted-foreground">{children}</p>
        ),
        a: ({ href, children }) => {
          let target = href ?? "#";
          if (target.endsWith(".md")) {
            target = `/docs/${target.replace(/^.*\//, "").replace(/\.md$/, "")}`;
          }
          const external = /^https?:/.test(target);
          return (
            <a
              href={target}
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {children}
            </a>
          );
        },
        ul: ({ children }) => (
          <ul className="my-4 ml-5 list-disc space-y-2 text-muted-foreground marker:text-muted-foreground/50">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 ml-5 list-decimal space-y-2 text-muted-foreground marker:text-muted-foreground/70">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-5 rounded-r-lg border-l-2 border-foreground/30 bg-muted/60 py-1 pl-4 pr-3 text-muted-foreground [&_p]:my-2">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-10 border-border" />,
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
        th: ({ children }) => (
          <th className="border-b border-border px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-border px-4 py-2.5 align-top text-foreground">
            {children}
          </td>
        ),
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className ?? "");
          const text = String(children).replace(/\n$/, "");
          if (match?.[1] === "mermaid") {
            return <Mermaid chart={text} />;
          }
          if (match) {
            return (
              <pre className="my-5 overflow-x-auto rounded-xl bg-[oklch(0.17_0_0)] px-4 py-3.5 text-[0.8125rem] leading-relaxed text-[oklch(0.9_0_0)]">
                <code>{text}</code>
              </pre>
            );
          }
          return (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
