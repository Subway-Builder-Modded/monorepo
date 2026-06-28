import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { articleMdxComponents } from "@/features/content/mdx";

describe("articleMdxComponents", () => {
  it("renders heading links with generated ids", () => {
    const H2 = articleMdxComponents.h2;
    render(<H2>Release Notes</H2>);

    const heading = screen.getByRole("heading", { name: "Link to Release Notes" });
    expect(heading).toHaveAttribute("id", "release-notes");
    expect(screen.getByRole("link", { name: "Link to Release Notes" })).toHaveAttribute(
      "href",
      "#release-notes",
    );
  });

  it("exposes tabs and admonition components for non-doc article pages", () => {
    const Tabs = articleMdxComponents.Tabs;
    const TabItem = articleMdxComponents.TabItem;
    const Note = articleMdxComponents.Note;

    render(
      <div>
        <Note>Heads up</Note>
        <Tabs>
          <TabItem value="a" label="Alpha" default>
            <p>Alpha body</p>
          </TabItem>
        </Tabs>
      </div>,
    );

    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByText("Alpha body")).toBeInTheDocument();
  });
});
