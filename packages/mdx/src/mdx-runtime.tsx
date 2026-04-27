import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentType } from "react";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { remarkHeadingIds } from "./remark/remark-heading-ids.ts";
import { remarkStripFrontmatter } from "./remark/remark-strip-frontmatter.ts";
import { remarkAdmonitionDirectives } from "./remark/remark-admonitions.ts";

type EvaluatedModule = {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

type MdxComponentMap = Record<string, ComponentType<any>>;

type CreateMdxRuntimeOptions = {
  components?: MdxComponentMap;
  remarkPlugins?: PluggableList;
};

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createDefaultRemarkPlugins(): PluggableList {
  return [
    remarkFrontmatter,
    remarkStripFrontmatter,
    remarkHeadingIds,
    remarkGfm,
    remarkDirective,
    remarkAdmonitionDirectives,
  ];
}

export function createMdxRuntime(options: CreateMdxRuntimeOptions = {}) {
  const compiledCache = new Map<string, React.ComponentType<any>>();
  const remarkPlugins = options.remarkPlugins ?? createDefaultRemarkPlugins();
  const components = options.components;

  async function evaluateMdx(
    source: string,
  ): Promise<ComponentType<{ components?: Record<string, ComponentType<any>> }>> {
    const cached = compiledCache.get(source);
    if (cached) {
      return cached;
    }

    const runtimeModule = (await evaluate(source, {
      ...jsxRuntime,
      remarkPlugins,
    })) as EvaluatedModule;

    compiledCache.set(source, runtimeModule.default);
    return runtimeModule.default;
  }

  async function renderHtml(source: string): Promise<{ html: string; warning?: string }> {
    try {
      const Content = await evaluateMdx(source);
      const html = renderToStaticMarkup(<Content components={components} />);
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

  async function renderPlainHtml(source: string): Promise<string> {
    try {
      const Content = await evaluateMdx(source);
      return renderToStaticMarkup(<Content />);
    } catch {
      return `<pre>${escapeHtml(source)}</pre>`;
    }
  }

  async function renderMarkdownHtml(source: string): Promise<string> {
    try {
      const file = await unified()
        .use(remarkParse)
        .use(remarkPlugins)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(source);

      return String(file);
    } catch {
      return `<p>${escapeHtml(source).replaceAll("\n", "<br />")}</p>`;
    }
  }

  return {
    evaluateMdx,
    renderHtml,
    renderPlainHtml,
    renderMarkdownHtml,
  };
}
