import { useEffect, useState } from "react";
import { renderPlaygroundHtml } from "@/features/markdown-playground/lib/mdx-runtime";
import { MdxRenderedHtml } from "@/features/content/mdx/rendered-html";

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

  return <MdxRenderedHtml html={html} />;
}
