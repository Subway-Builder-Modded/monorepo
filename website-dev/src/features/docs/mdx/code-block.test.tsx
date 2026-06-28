import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMdxRuntime } from "@subway-builder-modded/mdx";
import { CodeBlock } from "@/features/docs/mdx/code-block";
import { mdxComponents } from "@/features/docs/mdx/components";

describe("CodeBlock component", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders code content", () => {
    render(
      <CodeBlock>
        <code>console.log("hello")</code>
      </CodeBlock>,
    );

    expect(screen.getByText('console.log("hello")')).toBeInTheDocument();
  });

  it("shows copy button", () => {
    render(
      <CodeBlock>
        <code>test</code>
      </CodeBlock>,
    );

    expect(screen.getByLabelText("Copy code")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <CodeBlock title="config.ts">
        <code>export default {}</code>
      </CodeBlock>,
    );

    expect(screen.getByText("config.ts")).toBeInTheDocument();
  });

  it("uses soft-wrap classes instead of horizontal scrolling", () => {
    const { container } = render(
      <CodeBlock>
        <code>const veryLongTokenWithoutSpaces = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";</code>
      </CodeBlock>,
    );

    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toContain("overflow-x-hidden");
    expect(pre?.className).toContain("whitespace-pre-wrap");
    expect(pre?.className).toContain("break-words");
  });

  it("highlights requested code lines", () => {
    const { container } = render(
      <CodeBlock>
        <code className="language-ts" data-highlight-lines="2,4-5">
          {"const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\nconst e = 5;"}
        </code>
      </CodeBlock>,
    );

    const highlightedLines = Array.from(container.querySelectorAll("[data-highlighted-line]"));
    expect(highlightedLines).toHaveLength(3);
    expect(highlightedLines.map((line) => line.textContent)).toEqual([
      "const b = 2;",
      "const d = 4;",
      "const e = 5;",
    ]);
  });

  it("preserves fenced code metadata from MDX", async () => {
    const runtime = createMdxRuntime({ components: mdxComponents });
    const { html } = await runtime.renderHtml(
      '```ts {2} title="example.ts"\nconst a = 1;\nconst b = 2;\n```',
    );

    expect(html).toContain("example.ts");
    expect(html).toContain("data-highlighted-line");
    expect(html).toContain("const b = 2;");
  });
});
