import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import type React from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { articleMdxComponents } from "@/features/content/mdx";
import {
  remarkHeadingIds,
  remarkStripFrontmatter,
  remarkAdmonitionDirectives,
} from "@/features/content/mdx";

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

export async function renderPlaygroundHtml(
  source: string,
): Promise<{ html: string; warning?: string }> {
  try {
    const Content = await evaluatePlaygroundMdx(source);
    const html = renderToStaticMarkup(<Content components={articleMdxComponents} />);
    return { html };
  } catch {
    const fallback = await renderMarkdownHtml(source);
    return {
      html: fallback,
      warning:
        "Rich HTML fell back to Markdown rendering because the current content could not be fully rendered as MDX.",
    };
  }
}

export async function renderPlainHtml(source: string): Promise<string> {
  try {
    const Content = await evaluatePlaygroundMdx(source);
    return renderToStaticMarkup(<Content />);
  } catch {
    return `<pre>${escapeHtml(source)}</pre>`;
  }
}

export async function renderMarkdownHtml(source: string): Promise<string> {
  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .use(remarkStripFrontmatter)
      .use(remarkHeadingIds)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkAdmonitionDirectives)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(source);

    return String(file);
  } catch {
    return `<p>${escapeHtml(source).replaceAll("\n", "<br />")}</p>`;
  }
}
