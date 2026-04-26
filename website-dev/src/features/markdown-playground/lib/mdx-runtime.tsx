import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import type React from "react";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { articleMdxComponents } from "@/features/content/mdx";
import { remarkHeadingIds, remarkStripFrontmatter, remarkAdmonitionDirectives } from "@/features/content/mdx";

type EvaluatedModule = {
  default: React.ComponentType<{ components?: Record<string, React.ComponentType<any>> }>;
};

const compiledCache = new Map<string, React.ComponentType<any>>();

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function evaluatePlaygroundMdx(
  source: string,
): Promise<React.ComponentType<{ components?: Record<string, React.ComponentType<any>> }>> {
  const cached = compiledCache.get(source);
  if (cached) {
    return cached;
  }

  const runtimeModule = (await evaluate(source, {
    ...jsxRuntime,
    remarkPlugins: [
      remarkFrontmatter,
      remarkStripFrontmatter,
      remarkHeadingIds,
      remarkGfm,
      remarkDirective,
      remarkAdmonitionDirectives,
    ],
  })) as EvaluatedModule;

  compiledCache.set(source, runtimeModule.default);
  return runtimeModule.default;
}

export async function renderPlaygroundHtml(source: string): Promise<{ html: string; warning?: string }> {
  try {
    const Content = await evaluatePlaygroundMdx(source);
    const html = renderToStaticMarkup(<Content components={articleMdxComponents} />);
    return { html };
  } catch {
    const fallback = `<pre>${escapeHtml(source)}</pre>`;
    return {
      html: fallback,
      warning:
        "Rich HTML copy fell back to escaped source because the current content could not be fully rendered as MDX.",
    };
  }
}
