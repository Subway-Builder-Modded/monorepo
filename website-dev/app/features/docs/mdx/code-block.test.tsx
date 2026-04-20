import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { CodeBlock } from "@/app/features/docs/mdx/code-block";

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
});
