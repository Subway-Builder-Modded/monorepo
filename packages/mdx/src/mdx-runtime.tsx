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
import { remarkCodeBlockMeta } from "./remark/remark-code-block-meta.ts";
import { normalizeHtmlToMdx } from "./lib/normalize-html-to-mdx.ts";
import { slugify } from "./lib/slugify.ts";

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

function stripTags(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeLegacyHtml(source: string): boolean {
  const htmlTagCount = source.match(/<\/?[a-z][^>]*>/gi)?.length ?? 0;
  const markdownHeadingCount = source.match(/^#{1,6}\s/gm)?.length ?? 0;
  return htmlTagCount >= 12 && markdownHeadingCount === 0;
}

function appendClass(existingAttrs: string, classToAdd: string): string {
  const classMatch = existingAttrs.match(/\sclass\s*=\s*"([^"]*)"/i);
  if (!classMatch) {
    return `${existingAttrs} class="${classToAdd}"`;
  }

  const current = classMatch[1] ?? "";
  const merged = `${current} ${classToAdd}`.trim();
  return existingAttrs.replace(/\sclass\s*=\s*"([^"]*)"/i, ` class="${merged}"`);
}

function ensureHeadingId(attrs: string, headingContent: string): string {
  if (/\sid\s*=\s*"[^"]+"/i.test(attrs)) {
    return attrs;
  }

  const headingId = slugify(stripTags(headingContent));
  return headingId ? `${attrs} id="${headingId}"` : attrs;
}

function applyLegacyHtmlArticleStyling(html: string): string {
  const spoilerChevronSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-200 ease-out group-open:rotate-90 group-hover/summary:text-[var(--registry-type-accent,var(--suite-accent-light))] dark:group-hover/summary:text-[var(--registry-type-accent,var(--suite-accent-dark))]" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>';
  const spoilerDetailsClass =
    "group my-4 overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_12px_28px_-22px_rgba(var(--elevation-shadow-rgb),0.45)]";
  const spoilerSummaryClass =
    "group/summary flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-foreground outline-none hover:bg-muted/40 [&::-webkit-details-marker]:hidden";
  const spoilerLabelClass =
    "mdx-spoiler-label text-foreground transition-colors group-hover/summary:text-[var(--registry-type-accent,var(--suite-accent-light))] dark:group-hover/summary:text-[var(--registry-type-accent,var(--suite-accent-dark))]";
  const spoilerBodyClass =
    "border-t border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground/90 [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_.mdx-table-wrap]:m-1";

  const headingClasses: Record<string, string> = {
    h1: "group scroll-mt-24 text-foreground text-4xl font-extrabold mt-11 mb-5 tracking-tight",
    h2: "group scroll-mt-24 text-foreground text-3xl font-bold mt-10 mb-4 tracking-tight",
    h3: "group scroll-mt-24 text-foreground text-2xl font-semibold mt-7 mb-3 tracking-tight",
    h4: "group scroll-mt-24 text-foreground text-xl font-semibold mt-5 mb-2",
    h5: "group scroll-mt-24 text-foreground text-base font-medium mt-4 mb-1.5",
  };

  let result = html.replace(
    /<(h[1-5])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi,
    (_full, headingTag: string, rawAttrs: string | undefined, content: string) => {
      const lowerTag = headingTag.toLowerCase();
      const classes = headingClasses[lowerTag];
      let attrs = rawAttrs ?? "";
      attrs = ensureHeadingId(attrs, content);
      attrs = appendClass(attrs, classes);
      return `<${lowerTag}${attrs}>${content}</${lowerTag}>`;
    },
  );

  result = result.replace(
    /<(?:Details|details)(\s[^>]*)?>([\s\S]*?)<\/(?:Details|details)>/gi,
    (_full, rawDetailsAttrs: string | undefined, content: string) => {
      const summaryMatch = content.match(
        /<(?:Summary|summary)(\s[^>]*)?>([\s\S]*?)<\/(?:Summary|summary)>/i,
      );

      const summaryAttrs = appendClass(summaryMatch?.[1] ?? "", spoilerSummaryClass);
      const summaryContent = summaryMatch?.[2] ?? "";
      const bodyContent = summaryMatch ? content.replace(summaryMatch[0], "").trim() : content;
      const detailsAttrs = appendClass(rawDetailsAttrs ?? "", spoilerDetailsClass);

      return `<details${detailsAttrs}><summary${summaryAttrs}>${spoilerChevronSvg}<span class="inline-flex items-center gap-2"><span class="${spoilerLabelClass}">${summaryContent}</span></span></summary><div class="${spoilerBodyClass}">${bodyContent}</div></details>`;
    },
  );

  result = result.replace(/<ul(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(
      rawAttrs ?? "",
      "my-3 ml-6 list-disc space-y-1 text-foreground/90 marker:text-muted-foreground",
    );
    return `<ul${attrs}>`;
  });
  result = result.replace(/<ol(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(
      rawAttrs ?? "",
      "my-3 ml-6 list-decimal space-y-1 text-foreground/90 marker:text-muted-foreground",
    );
    return `<ol${attrs}>`;
  });
  result = result.replace(/<li(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(rawAttrs ?? "", "leading-relaxed");
    return `<li${attrs}>`;
  });

  result = result.replace(/<table(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(rawAttrs ?? "", "w-full table-fixed text-sm");
    return `<div class="mdx-table-wrap my-4 overflow-x-auto rounded-lg border border-border/50"><table${attrs}>`;
  });
  result = result.replace(/<\/table>/gi, "</table></div>");

  result = result.replace(/<thead(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(rawAttrs ?? "", "border-b border-border/50 bg-muted/30");
    return `<thead${attrs}>`;
  });
  result = result.replace(/<th(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(
      rawAttrs ?? "",
      "align-middle px-4 py-2.5 text-left font-semibold text-muted-foreground [&_svg]:text-muted-foreground",
    );
    return `<th${attrs}>`;
  });
  result = result.replace(/<td(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(
      rawAttrs ?? "",
      "border-t border-border/30 px-4 py-2.5 text-foreground/85",
    );
    return `<td${attrs}>`;
  });
  result = result.replace(/<blockquote(\s[^>]*)?>/gi, (_full, rawAttrs: string | undefined) => {
    const attrs = appendClass(
      rawAttrs ?? "",
      "my-4 border-l-2 border-border/50 pl-4 text-foreground/70 italic",
    );
    return `<blockquote${attrs}>`;
  });

  return result;
}

export function createDefaultRemarkPlugins(): PluggableList {
  return [
    remarkFrontmatter,
    remarkStripFrontmatter,
    remarkHeadingIds,
    remarkGfm,
    remarkDirective,
    remarkAdmonitionDirectives,
    remarkCodeBlockMeta,
  ];
}

export function createMdxRuntime(options: CreateMdxRuntimeOptions = {}) {
  const compiledCache = new Map<string, React.ComponentType<any>>();
  const remarkPlugins = options.remarkPlugins ?? createDefaultRemarkPlugins();
  const components = options.components;

  async function evaluateMdx(
    source: string,
  ): Promise<ComponentType<{ components?: Record<string, ComponentType<any>> }>> {
    const normalizedSource = normalizeHtmlToMdx(source);
    const cached = compiledCache.get(normalizedSource);
    if (cached) {
      return cached;
    }

    const runtimeModule = (await evaluate(normalizedSource, {
      ...jsxRuntime,
      remarkPlugins,
    })) as EvaluatedModule;

    compiledCache.set(normalizedSource, runtimeModule.default);
    return runtimeModule.default;
  }

  async function renderHtml(source: string): Promise<{ html: string; warning?: string }> {
    const normalizedSource = normalizeHtmlToMdx(source);

    if (looksLikeLegacyHtml(normalizedSource)) {
      const legacyHtml = await renderMarkdownHtml(normalizedSource);
      return { html: applyLegacyHtmlArticleStyling(legacyHtml) };
    }

    try {
      const Content = await evaluateMdx(source);
      const html = renderToStaticMarkup(<Content components={components} />);
      return { html };
    } catch {
      const markdownFallback = await renderMarkdownHtml(source);
      return {
        html: applyLegacyHtmlArticleStyling(markdownFallback),
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
      return renderMarkdownHtml(source);
    }
  }

  async function renderMarkdownHtml(source: string): Promise<string> {
    try {
      const normalizedSource = normalizeHtmlToMdx(source);
      const file = await unified()
        .use(remarkParse)
        .use(remarkPlugins)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(normalizedSource);

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
