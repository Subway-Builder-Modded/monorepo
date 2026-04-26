import { describe, expect, it } from "vitest";
import { renderPlaygroundHtml } from "@/features/markdown-playground/lib/mdx-runtime";

describe("renderPlaygroundHtml", () => {
  it("uses canonical MDX component rendering for rich preview/html", async () => {
    const result = await renderPlaygroundHtml("<Tabs><TabItem label=\"One\">Body</TabItem></Tabs>");

    expect(result.warning).toBeUndefined();
    expect(result.html).toContain('role="tablist"');
  });
});
