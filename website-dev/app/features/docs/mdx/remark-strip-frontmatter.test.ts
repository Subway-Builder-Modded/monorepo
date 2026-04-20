import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import type { Root } from "mdast";
import { remarkStripFrontmatter } from "@/app/features/docs/mdx/remark-strip-frontmatter";

function parse(md: string): Root {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml", "toml"])
    .use(remarkStripFrontmatter);

  return processor.runSync(processor.parse(md)) as Root;
}

describe("remarkStripFrontmatter", () => {
  it("removes yaml frontmatter nodes", () => {
    const tree = parse(`---\ntitle: Test\n---\n\n## Hello`);
    expect(tree.children.some((n) => n.type === "yaml")).toBe(false);
  });

  it("preserves markdown content", () => {
    const tree = parse(`---\ntitle: Test\n---\n\n## Hello`);
    expect(tree.children.some((n) => n.type === "heading")).toBe(true);
  });
});
