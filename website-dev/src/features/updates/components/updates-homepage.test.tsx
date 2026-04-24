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
      id: "v1.0.0",
      suiteId: "template-mod",
      sourcePath: "/content/template-mod/updates/v1.0.0.mdx",
      routePath: "/template-mod/updates/v1.0.0",
      raw: "",
      loader: vi.fn(),
      frontmatter: {
        title: "Template Mod v1.0.0",
        description: "Stable release.",
        icon: "WandSparkles",
        date: "2026-04-10",
        tag: "release",
        url: "https://example.com",
      },
    },
  ]),
}));

describe("UpdatesHomepage", () => {
  it("renders update directory cards with metadata", () => {
    render(<UpdatesHomepage suiteId="template-mod" />);

    expect(screen.getByRole("heading", { name: "Updates" })).toBeInTheDocument();
    expect(screen.getByText("Changelogs and release notes for Template Mod.")).toBeInTheDocument();
    expect(screen.getByText("Releases")).toBeInTheDocument();
    expect(screen.getAllByText("v1.0.0 • 2026-04-10").length).toBeGreaterThan(0);

    const card = screen.getByRole("link", { name: /Template Mod v1.0.0/i });
    expect(card).toHaveAttribute("href", "/template-mod/updates/v1.0.0");
    expect(screen.getByText("Release")).toBeInTheDocument();
    expect(screen.getAllByText("Latest").length).toBeGreaterThan(0);
  });
});
