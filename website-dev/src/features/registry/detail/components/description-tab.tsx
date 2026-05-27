import { useEffect, useState } from "react";
import { renderPlaygroundHtml } from "@/features/markdown-playground/lib/mdx-runtime";
import { cn } from "@/lib/utils";

type DescriptionTabProps = {
  description: string;
};

export function DescriptionTab({ description }: DescriptionTabProps) {
  if (!description.trim()) {
    return (
      <p className="text-sm text-muted-foreground">No description is available for this project.</p>
    );
  }

  return <DescriptionMarkup source={description} />;
}

function escapeHtml(source: string): string {
  return source
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function DescriptionMarkup({ source }: { source: string }) {
  const [html, setHtml] = useState(() => `<p>${escapeHtml(source).replaceAll("\n", "<br />")}</p>`);

  useEffect(() => {
    let cancelled = false;

    void renderPlaygroundHtml(source).then(({ html: nextHtml }) => {
      if (!cancelled) {
        setHtml(nextHtml);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div
      className={cn(
        "prose-docs max-w-none text-sm leading-7 prose-headings:font-semibold",
        "[&>*:first-child]:mt-0",
        "[&>*:last-child]:mb-0",
        "[&_a]:!text-[var(--registry-type-accent)] [&_a]:underline [&_a]:underline-offset-2",
        "[&_a:visited]:!text-[var(--registry-type-accent)]",
        "[&_h1_a]:!text-inherit [&_h1_a]:no-underline [&_h1_a:hover]:underline",
        "[&_h1_a:visited]:!text-inherit",
        "[&_h2_a]:!text-inherit [&_h2_a]:no-underline [&_h2_a:hover]:underline",
        "[&_h2_a:visited]:!text-inherit",
        "[&_h3_a]:!text-inherit [&_h3_a]:no-underline [&_h3_a:hover]:underline",
        "[&_h3_a:visited]:!text-inherit",
        "[&_h4_a]:!text-inherit [&_h4_a]:no-underline [&_h4_a:hover]:underline",
        "[&_h4_a:visited]:!text-inherit",
        "[&_h5_a]:!text-inherit [&_h5_a]:no-underline [&_h5_a:hover]:underline",
        "[&_h5_a:visited]:!text-inherit",
        "[&_.group/summary:hover_.mdx-spoiler-label]:!text-[var(--registry-type-accent)]",
        "[&_.dark_.group/summary:hover_.mdx-spoiler-label]:!text-[var(--registry-type-accent)]",
        "[&_h2]:scroll-mt-24",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
