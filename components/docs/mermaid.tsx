"use client";

import { useEffect, useId, useState } from "react";

/**
 * Renders a Mermaid diagram from its source. `mermaid` is dynamically
 * imported so the (large) library only loads on pages that have a diagram.
 */
export function Mermaid({ chart }: { chart: string }) {
  const rawId = useId();
  const id = `m-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px",
            background: "#ffffff",
            primaryColor: "#ffffff",
            primaryBorderColor: "#1c1b1b",
            primaryTextColor: "#1c1b1b",
            lineColor: "#9a9a9a",
            secondaryColor: "#f4f3f2",
            tertiaryColor: "#fafafa",
          },
        });
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (failed) {
    return (
      <pre className="my-6 overflow-x-auto rounded-2xl bg-[oklch(0.17_0_0)] px-4 py-3.5 text-[0.8125rem] text-[oklch(0.9_0_0)]">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-2xl border border-border bg-card p-5"
      aria-label="Diagram"
      // mermaid output is sanitized (securityLevel: "strict")
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
