import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AsyncArticleContent } from "@/features/content/components/async-article-content";

const components = {};

describe("AsyncArticleContent", () => {
  it("renders loaded mdx component", async () => {
    const loadContent = vi.fn(async () => {
      const Content = ({ components: incoming }: { components: unknown }) => (
        <div>
          Loaded with components: {incoming === components ? "yes" : "no"}
        </div>
      );
      return Content;
    });

    render(
      <AsyncArticleContent sourcePath="/content/test.mdx" loadContent={loadContent} components={components} />,
    );

    expect(await screen.findByText(/Loaded with components: yes/i)).toBeInTheDocument();
    expect(loadContent).toHaveBeenCalledWith("/content/test.mdx");
  });

  it("renders missing-content state", async () => {
    render(
      <AsyncArticleContent
        sourcePath="/content/missing.mdx"
        loadContent={vi.fn(async () => null)}
        components={components}
      />,
    );

    expect(await screen.findByText("Content not found")).toBeInTheDocument();
  });

  it("renders failed-content state", async () => {
    render(
      <AsyncArticleContent
        sourcePath="/content/fail.mdx"
        loadContent={vi.fn(async () => {
          throw new Error("boom");
        })}
        components={components}
      />,
    );

    expect(await screen.findByText("Failed to load content")).toBeInTheDocument();
  });
});
