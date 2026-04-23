import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mdxComponents } from "@/features/docs/mdx/components";

describe("mdxComponents rendering behavior", () => {
  it("renders fragment-only links as plain anchors so the browser scrolls instead of navigating", () => {
    const A = mdxComponents.a as React.ComponentType<{ href: string; children: React.ReactNode }>;
    render(<A href="#some-section">jump down</A>);
    const link = screen.getByRole("link", { name: "jump down" });
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute("href", "#some-section");
  });

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

    const summary = screen.getByText("More Information").closest("summary");
    expect(summary).not.toBeNull();
    expect(summary?.className).toContain("cursor-pointer");
    expect(summary?.className).toContain("list-none");
    expect(screen.getByText("More Information").className).toContain(
      "group-hover/summary:text-[var(--suite-accent-light)]",
    );

    expect(screen.getByText("Inner content body")).toBeInTheDocument();
  });

  it("renders Spoiler with themed summary and body content", () => {
    const Spoiler = mdxComponents.Spoiler;

    render(<Spoiler title="Hidden setup">Secret steps</Spoiler>);

    expect(screen.getByText("Hidden setup")).toBeInTheDocument();
    expect(screen.getByText("Secret steps")).toBeInTheDocument();
  });

  it("accepts both title and icon args on Spoiler", () => {
    const Spoiler = mdxComponents.Spoiler;

    render(
      <Spoiler title="Install notes" icon="Info">
        Extra installation notes
      </Spoiler>,
    );

    expect(screen.getByText("Install notes")).toBeInTheDocument();
    expect(screen.getByText("Extra installation notes")).toBeInTheDocument();
    expect(document.querySelector("summary svg")).not.toBeNull();
  });

  it("renders code-styled Tabs via variant parameter with tab icons", () => {
    const Tabs = mdxComponents.Tabs;
    const TabItem = mdxComponents.TabItem;

    render(
      <Tabs variant="code">
        <TabItem value="bash" label="Bash" icon="Terminal" default>
          echo one
        </TabItem>
        <TabItem value="powershell" label="PowerShell" icon="Shield">
          echo two
        </TabItem>
      </Tabs>,
    );

    expect(screen.getByRole("tab", { name: "Bash" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PowerShell" })).toBeInTheDocument();
    expect(screen.getByText("echo one")).toBeInTheDocument();
    expect(document.querySelector('[role="tab"] svg')).not.toBeNull();
  });

  it("renders code blocks embedded within code variant tabs without nested outer card chrome", () => {
    const Tabs = mdxComponents.Tabs;
    const TabItem = mdxComponents.TabItem;
    const Pre = mdxComponents.pre;

    const { container } = render(
      <Tabs variant="code">
        <TabItem value="bash" label="Bash" default>
          <Pre data-language="bash" title="install.sh">
            <code>echo embedded</code>
          </Pre>
        </TabItem>
      </Tabs>,
    );

    expect(screen.getByText("echo embedded")).toBeInTheDocument();
    expect(screen.getByText("install.sh")).toBeInTheDocument();
    expect(container.querySelector(".my-4.overflow-hidden.rounded-lg")).toBeNull();
  });
});
