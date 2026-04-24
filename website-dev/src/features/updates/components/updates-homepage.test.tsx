import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UpdatesHomepage } from "@/features/updates/components/updates-homepage";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/updates/lib/content", () => ({
  getUpdatesEntries: vi.fn(() => [
    {
      id: "v1.0.1",
      suiteId: "template-mod",
      sourcePath: "/content/template-mod/updates/v1.0.1.mdx",
      routePath: "/template-mod/updates/v1.0.1",
      raw: "",
      loader: vi.fn(),
      frontmatter: {
        title: "Template Mod v1.0.1",
        icon: "WandSparkles",
        date: "2026-04-10",
        tag: "release",
        url: "https://example.com/v1.0.1",
      },
    },
    {
      id: "v1.0.0",
      suiteId: "template-mod",
      sourcePath: "/content/template-mod/updates/v1.0.0.mdx",
      routePath: "/template-mod/updates/v1.0.0",
      raw: "",
      loader: vi.fn(),
      frontmatter: {
        title: "Template Mod v1.0.0",
        icon: "WandSparkles",
        date: "2026-03-12",
        tag: "beta",
        url: "https://example.com/v1.0.0",
      },
    },
    {
      id: "v0.9.0",
      suiteId: "template-mod",
      sourcePath: "/content/template-mod/updates/v0.9.0.mdx",
      routePath: "/template-mod/updates/v0.9.0",
      raw: "",
      loader: vi.fn(),
      frontmatter: {
        title: "Template Mod v0.9.0",
        icon: "WandSparkles",
        date: "2025-12-31",
        tag: "alpha",
      },
    },
  ]),
}));

describe("UpdatesHomepage", () => {
  it("renders release directory and config-driven identity", () => {
    render(<UpdatesHomepage suiteId="template-mod" />);

    expect(screen.getByRole("heading", { name: "Updates" })).toBeInTheDocument();
    expect(
      screen.getByText("View the changelogs and release notes for the Template Mod."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Latest Version")).not.toBeInTheDocument();
    expect(screen.getByText("Releases")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Template Mod v1.0.1/i })).toHaveAttribute(
      "href",
      "/template-mod/updates/v1.0.1",
    );

    expect(screen.queryByText("Refine History")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Beta" })).not.toBeInTheDocument();

    expect(screen.queryByRole("heading", { name: "2026" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "2025" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Latest").length).toBeGreaterThan(0);
  });
});
