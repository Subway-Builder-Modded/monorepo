import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { mdxComponents } from "@/app/features/docs/mdx/components";

describe("mdxComponents rendering behavior", () => {
  it("honors explicit heading IDs for static linking", () => {
    const H2 = mdxComponents.h2;
    render(<H2 id="fixed-id">Explicit Heading</H2>);

    const heading = screen.getByRole("heading", { name: "Link to Explicit Heading" });
    expect(heading).toHaveAttribute("id", "fixed-id");

    const anchor = screen.getByRole("link", { name: "Link to Explicit Heading" });
    expect(anchor).toHaveAttribute("href", "#fixed-id");
  });

  it("renders details/summary with custom docs styling", () => {
    const Details = mdxComponents.details;
    const Summary = mdxComponents.summary;

    render(
      <Details>
        <Summary>More Information</Summary>
        <p>Inner content body</p>
      </Details>,
    );

    const summary = screen.getByText("More Information");
    expect(summary.className).toContain("cursor-pointer");
    expect(summary.className).toContain("hover:text-[var(--suite-accent-light)]");

    expect(screen.getByText("Inner content body")).toBeInTheDocument();
  });
});
