import { describe, expect, it } from "vitest";
import {
  renderMarkdownHtml,
  renderPlaygroundHtml,
} from "@/features/markdown-playground/lib/mdx-runtime";

describe("renderPlaygroundHtml", () => {
  it("uses canonical MDX component rendering for rich preview/html", async () => {
    const result = await renderPlaygroundHtml('<Tabs><TabItem label="One">Body</TabItem></Tabs>');

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain('role="tablist"');
  });
});

describe("renderMarkdownHtml", () => {
  it("renders markdown content to rich html", async () => {
    const html = await renderMarkdownHtml("# Title\n\nThis is **bold** text.");

    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).not.toContain("<pre>");
  });
});
