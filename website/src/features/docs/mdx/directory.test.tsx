import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Directory } from "@/features/docs/mdx/directory";
import { DocsRouteProvider } from "@/features/docs/mdx/docs-route-context";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@subway-builder-modded/icons", () => ({
  resolveIcon: () => () => <svg data-testid="directory-icon" />,
}));

vi.mock("@/features/docs/lib", () => ({
  getDocsTree: vi.fn(() => ({
    suiteId: "railyard",
    version: "v0.2",
    nodes: [
      {
        kind: "page",
        key: "players",
        slug: "players",
        routePath: "/railyard/docs/v0.2/players",
        sourcePath: "/content/railyard/docs/v0.2/players.mdx",
        frontmatter: {
          title: "Players",
          description: "Manage players",
          icon: "FileText",
        },
        suiteId: "railyard",
        version: "v0.2",
        children: [],
        depth: 0,
      },
    ],
  })),
  getVisibleNodes: vi.fn((nodes) => nodes),
}));

describe("Directory MDX component", () => {
  it("renders directory cards and links", () => {
    render(<Directory suiteId="railyard" version="v0.2" />);

    const players = screen.getByRole("link", { name: /Players/i });
    expect(players).toHaveAttribute("href", "/railyard/docs/v0.2/players");
    expect(screen.getByTestId("directory-icon")).toBeInTheDocument();
  });

  it("returns null when the target folder has no children", () => {
    const { container } = render(<Directory suiteId="railyard" version="v0.2" path="/missing" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("infers suiteId, version, and slug from the surrounding docs route context when used bare in MDX", () => {
    render(
      <DocsRouteProvider value={{ suiteId: "railyard", version: "v0.2", slug: "/" }}>
        <Directory />
      </DocsRouteProvider>,
    );

    // With slug "/" the directory falls back to the suite's top-level visible
    // nodes, so the seeded "Players" entry must render without props.
    expect(screen.getByRole("link", { name: /Players/i })).toHaveAttribute(
      "href",
      "/railyard/docs/v0.2/players",
    );
  });
});
