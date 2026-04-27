import { createMdxRuntime } from "@subway-builder-modded/mdx";
import { articleMdxComponents } from "@/features/content/mdx";

const runtime = createMdxRuntime({
  components: articleMdxComponents,
});

export const evaluatePlaygroundMdx = runtime.evaluateMdx;

export async function renderPlaygroundHtml(
  source: string,
): Promise<{ html: string; warning?: string }> {
  return runtime.renderHtml(source);
}

export const renderPlainHtml = runtime.renderPlainHtml;
export const renderMarkdownHtml = runtime.renderMarkdownHtml;
