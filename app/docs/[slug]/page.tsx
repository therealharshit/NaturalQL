import Link from "next/link";
import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { docs, getDocMeta, getAdjacentDocs } from "@/lib/docs";
import { Markdown } from "@/components/docs/markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getDocMeta(slug);
  if (!meta) return {};
  return {
    title: `${meta.title} · Natural QL Docs`,
    description: meta.description,
  };
}

async function readDoc(file: string): Promise<string> {
  const full = path.join(process.cwd(), "docs", file);
  return fs.readFile(full, "utf8");
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getDocMeta(slug);
  if (!meta) notFound();

  const content = await readDoc(meta.file);
  const { prev, next } = getAdjacentDocs(slug);

  return (
    <article className="min-w-0">
      <Markdown content={content} />

      {/* Prev / next navigation */}
      <nav className="mt-16 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="group rounded-xl border border-border p-4 transition-colors hover:bg-accent"
          >
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Previous
            </span>
            <span className="mt-1 block text-sm font-medium text-foreground">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="group rounded-xl border border-border p-4 text-right transition-colors hover:bg-accent"
          >
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Next
            </span>
            <span className="mt-1 block text-sm font-medium text-foreground">
              {next.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
