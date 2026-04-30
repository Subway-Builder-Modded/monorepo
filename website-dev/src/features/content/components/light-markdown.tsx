import { useEffect, useState } from "react";
import { renderMarkdownHtml } from "@/features/markdown-playground/lib/mdx-runtime";
import { cn } from "@/lib/utils";

type LightMarkdownProps = {
  children: string;
  className?: string;
};

const BASE_CLASS_NAME = [
  "min-w-0",
  "[&>*:first-child]:mt-0",
  "[&>*:last-child]:mb-0",
  "[&_p]:m-0",
  "[&_p:not(:first-child)]:mt-3",
  "[&_ul]:my-0",
  "[&_ul]:list-disc",
  "[&_ul]:pl-5",
  "[&_ol]:my-0",
  "[&_ol]:list-decimal",
  "[&_ol]:pl-5",
  "[&_li+li]:mt-1",
  "[&_strong]:font-semibold",
  "[&_em]:italic",
  "[&_del]:line-through",
  "[&_code]:rounded-md",
  "[&_code]:bg-foreground/6",
  "[&_code]:px-1.5",
  "[&_code]:py-0.5",
  "[&_code]:font-mono",
  "[&_code]:text-[0.92em]",
  "[&_pre]:mt-3",
  "[&_pre]:overflow-x-auto",
  "[&_pre]:rounded-xl",
  "[&_pre]:border",
  "[&_pre]:border-border/55",
  "[&_pre]:bg-muted/45",
  "[&_pre]:p-3",
  "[&_pre_code]:bg-transparent",
  "[&_pre_code]:p-0",
  "[&_pre_code]:text-inherit",
  "[&_a]:underline",
  "[&_a]:underline-offset-4",
].join(" ");

const htmlCache = new Map<string, string>();
const pendingHtmlCache = new Map<string, Promise<string>>();

function escapeHtml(source: string): string {
  return source
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderFallbackHtml(source: string): string {
  return `<p>${escapeHtml(source).replaceAll("\n", "<br />")}</p>`;
}

function getInitialHtml(source: string): string {
  return htmlCache.get(source) ?? renderFallbackHtml(source);
}

async function getMarkdownHtml(source: string): Promise<string> {
  const cached = htmlCache.get(source);
  if (cached) {
    return cached;
  }

  const pending = pendingHtmlCache.get(source);
  if (pending) {
    return pending;
  }

  const request = renderMarkdownHtml(source)
    .catch(() => renderFallbackHtml(source))
    .then((html) => {
      htmlCache.set(source, html);
      pendingHtmlCache.delete(source);
      return html;
    });

  pendingHtmlCache.set(source, request);
  return request;
}

export function LightMarkdown({ children, className }: LightMarkdownProps) {
  const [html, setHtml] = useState(() => getInitialHtml(children));

  useEffect(() => {
    let cancelled = false;
    setHtml(getInitialHtml(children));

    void getMarkdownHtml(children).then((nextHtml) => {
      if (!cancelled) {
        setHtml(nextHtml);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [children]);

  return <div className={cn(BASE_CLASS_NAME, className)} dangerouslySetInnerHTML={{ __html: html }} />;
}