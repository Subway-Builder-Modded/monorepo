import { createMdxRuntime } from "@subway-builder-modded/mdx";
import { articleMdxComponents } from "@/features/content/mdx";

const runtime = createMdxRuntime({
  components: articleMdxComponents,
});

const TEMPLATE_IF_OPEN = /\{\{#IF\s+[^}]+\}\}/g;
const TEMPLATE_IF_CLOSE = /\{\{\/IF\}\}/g;
const TEMPLATE_ROW_PLACEHOLDER = /^\s*\{\{\s*([A-Za-z0-9_]+_ROWS)\s*\}\}\s*$/gm;
const TEMPLATE_VALUE_PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

function prettifyTemplateToken(token: string): string {
  return token
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeTemplateSyntax(source: string): string {
  return source
    .replace(HTML_COMMENT, "")
    .replace(TEMPLATE_IF_OPEN, "")
    .replace(TEMPLATE_IF_CLOSE, "")
    .replace(TEMPLATE_ROW_PLACEHOLDER, (_full, token: string) => {
      return `<tr><td><em>${prettifyTemplateToken(token)}</em></td></tr>`;
    })
    .replace(TEMPLATE_VALUE_PLACEHOLDER, (_full, token: string) => `[${prettifyTemplateToken(token)}]`);
}

export const evaluatePlaygroundMdx = runtime.evaluateMdx;

export async function renderPlaygroundHtml(
  source: string,
): Promise<{ html: string; warning?: string }> {
  return runtime.renderHtml(normalizeTemplateSyntax(source));
}

export async function renderPlainHtml(source: string): Promise<string> {
  return runtime.renderPlainHtml(normalizeTemplateSyntax(source));
}

export async function renderMarkdownHtml(source: string): Promise<string> {
  return runtime.renderMarkdownHtml(normalizeTemplateSyntax(source));
}
