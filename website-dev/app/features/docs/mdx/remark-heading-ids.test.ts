import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkHeadingIds } from "@/app/features/docs/mdx/remark-heading-ids";
import type { Root, Heading } from "mdast";

function parseWithPlugin(md: string): Root {
  const processor = unified().use(remarkParse).use(remarkHeadingIds);
  return processor.runSync(processor.parse(md)) as Root;
}

function getHeadings(tree: Root): Heading[] {
  const headings: Heading[] = [];
  function walk(node: { type: string; children?: unknown[] }) {
    if (node.type === "heading") headings.push(node as Heading);
    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) walk(child as { type: string });
    }
  }
  walk(tree);
  return headings;
}

describe("remarkHeadingIds", () => {
  it("extracts {#id} and sets hProperties.id", () => {
    const tree = parseWithPlugin("## My Heading {#my-heading}");
    const headings = getHeadings(tree);
    expect(headings).toHaveLength(1);
    expect((headings[0].data?.hProperties as Record<string, string>)?.id).toBe("my-heading");
  });

  it("strips {#id} from heading text", () => {
    const tree = parseWithPlugin("## Step 1 - Setup {#setup}");
    const headings = getHeadings(tree);
    const text = headings[0].children[0];
    expect(text.type).toBe("text");
    if (text.type === "text") {
      expect(text.value).toBe("Step 1 - Setup");
    }
  });

  it("leaves headings without {#id} unchanged", () => {
    const tree = parseWithPlugin("## Normal Heading");
    const headings = getHeadings(tree);
    expect(headings[0].data).toBeUndefined();
    const text = headings[0].children[0];
    if (text.type === "text") {
      expect(text.value).toBe("Normal Heading");
    }
  });

  it("handles multiple headings", () => {
    const md = `## First {#first}

Some text.

### Second {#second}

## Third
`;
    const tree = parseWithPlugin(md);
    const headings = getHeadings(tree);
    expect(headings).toHaveLength(3);
    expect((headings[0].data?.hProperties as Record<string, string>)?.id).toBe("first");
    expect((headings[1].data?.hProperties as Record<string, string>)?.id).toBe("second");
    expect(headings[2].data).toBeUndefined();
  });

  it("only accepts valid id patterns (lowercase, hyphens, numbers)", () => {
    const tree = parseWithPlugin("## Heading {#valid-id-123}");
    const headings = getHeadings(tree);
    expect((headings[0].data?.hProperties as Record<string, string>)?.id).toBe("valid-id-123");
  });

  it("ignores invalid id syntax", () => {
    // Spaces are not valid in explicit IDs
    const tree = parseWithPlugin("## Heading {#invalid id}");
    const headings = getHeadings(tree);
    expect(headings[0].data).toBeUndefined();
  });
});
