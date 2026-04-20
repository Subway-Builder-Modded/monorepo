import { describe, expect, it } from "vite-plus/test";
import { mdxToMarkdown } from "@/app/features/docs/lib/markdown-copy";

describe("mdxToMarkdown", () => {
  it("strips frontmatter", () => {
    const raw = `---
title: Test
description: A test page
---

## Hello World

Some content.`;

    const result = mdxToMarkdown(raw);
    expect(result).not.toContain("---");
    expect(result).not.toContain("title: Test");
    expect(result).toContain("## Hello World");
    expect(result).toContain("Some content.");
  });

  it("converts note admonitions to GitHub blockquote alerts", () => {
    const raw = `:::note
This is a note.
:::`;

    const result = mdxToMarkdown(raw);
    expect(result).toContain("> [!NOTE]");
    expect(result).toContain("> This is a note.");
  });

  it("converts warning admonitions", () => {
    const raw = `:::warning
Be careful!
:::`;

    const result = mdxToMarkdown(raw);
    expect(result).toContain("> [!WARNING]");
  });

  it("strips JSX components", () => {
    const raw = `<DocsCardGrid>
  <DocsCard title="Test" href="/test" icon="Star">
    Description
  </DocsCard>
</DocsCardGrid>`;

    const result = mdxToMarkdown(raw);
    expect(result).not.toContain("<DocsCardGrid>");
    expect(result).not.toContain("<DocsCard");
  });

  it("preserves regular markdown content", () => {
    const raw = `## Heading

- List item 1
- List item 2

**Bold text** and *italic text*.

\`\`\`bash
echo "hello"
\`\`\``;

    const result = mdxToMarkdown(raw);
    expect(result).toContain("## Heading");
    expect(result).toContain("- List item 1");
    expect(result).toContain("**Bold text**");
    expect(result).toContain('echo "hello"');
  });
});
