/**
 * Docs registry. The slugs map to markdown files in the `docs/` directory,
 * which are the single source of truth (same files rendered on GitHub).
 * Kept free of node:fs imports so client components can read the nav too.
 */
export type DocMeta = {
  slug: string;
  title: string;
  description: string;
  file: string;
};

export const docs: DocMeta[] = [
  {
    slug: "user-guide",
    title: "User Guide",
    description:
      "Connect a database, ask questions in plain English, and review and run queries. Start here.",
    file: "user-guide.md",
  },
  {
    slug: "developer-docs",
    title: "Developer Docs",
    description:
      "Architecture, diagrams, API routes, and the safety model. Start here to build on it.",
    file: "developer-docs.md",
  },
];

export function getDocMeta(slug: string): DocMeta | undefined {
  return docs.find((d) => d.slug === slug);
}

/** Previous / next docs for in-page navigation. */
export function getAdjacentDocs(slug: string): {
  prev: DocMeta | null;
  next: DocMeta | null;
} {
  const i = docs.findIndex((d) => d.slug === slug);
  return {
    prev: i > 0 ? docs[i - 1] : null,
    next: i >= 0 && i < docs.length - 1 ? docs[i + 1] : null,
  };
}
