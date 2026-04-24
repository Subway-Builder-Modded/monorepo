import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocPageLayout } from "@/features/docs/components/doc-page-layout";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/docs/components/sidebar", () => ({
  DocsSidebar: () => <aside data-testid="docs-sidebar" />,
  MobileDocsSidebar: () => <div data-testid="mobile-docs-sidebar" />,
}));

vi.mock("@/features/docs/components/on-this-page", () => ({
  OnThisPage: () => <aside data-testid="on-this-page" />,
}));

vi.mock("@/features/docs/lib/icon-resolver", () => ({
  resolveIcon: () => (props: { className?: string }) => (
    <svg data-testid="doc-title-icon" {...props} />
  ),
}));

vi.mock("@/features/docs/lib/headings", () => ({
  extractHeadings: () => [
    { id: "intro", text: "Intro", level: 2 },
    { id: "setup", text: "Setup", level: 3 },
  ],
}));

vi.mock("@/features/docs/lib/content", () => ({
  getDocsTree: vi.fn((suiteId: string, version: string | null) => ({
    suiteId,
    version,
    nodes: [],
  })),
  findTreeNode: vi.fn((_tree, slug: string) => ({
    kind: "page",
    key: slug.split("/").pop(),
    slug,
    routePath: `/railyard/docs/v0.2/${slug}`,
    sourcePath: `/content/railyard/docs/v0.2/${slug}.mdx`,
    frontmatter: {
      title: "GitHub Token",
      description: "Configure your token for publishing and sync.",
      icon: "FileText",
    },
    suiteId: "railyard",
    version: "v0.2",
    children: [],
    depth: 0,
  })),
  loadDocContent: vi.fn(async () => () => <div>Doc body content</div>),
  getDocRawContent: vi.fn(() => "## Intro\n\nSome docs text."),
  getDocSourcePath: vi.fn(() => "/content/railyard/docs/v0.2/players/github-token.mdx"),
  getEditUrl: vi.fn(
    () =>
      "https://github.com/Subway-Builder-Modded/monorepo/edit/main/website/content/railyard/docs/v0.2/players/github-token.mdx",
  ),
}));

describe("DocPageLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders versioned breadcrumb with suite documentation first crumb and clickable parents", () => {
    render(<DocPageLayout suiteId="railyard" version="v0.2" slug="players/github-token" />);

    const suiteCrumb = screen.getByRole("link", { name: "Railyard Documentation (v0.2)" });
    expect(suiteCrumb).toHaveAttribute("href", "/railyard/docs?version=v0.2");

    const parentCrumb = screen.getByRole("link", { name: "players" });
    expect(parentCrumb).toHaveAttribute("href", "/railyard/docs/v0.2/players");
  });

  it("renders non-versioned breadcrumb for registry without version text", () => {
    render(<DocPageLayout suiteId="registry" version={null} slug="publishing-projects" />);

    expect(screen.getByRole("link", { name: "Registry Documentation" })).toBeInTheDocument();
    expect(screen.queryByText(/\(v/i)).not.toBeInTheDocument();
  });

  it("uses neutral breadcrumb links for deprecated versions", () => {
    render(<DocPageLayout suiteId="railyard" version="v0.1" slug="players/github-token" />);

    const suiteCrumb = screen.getByRole("link", { name: "Railyard Documentation (v0.1)" });
    expect(suiteCrumb.className).toContain("text-muted-foreground");
    expect(suiteCrumb.className).toContain("hover:text-[var(--suite-accent-light)]");
    expect(suiteCrumb.className).toContain("hover:no-underline");
  });

  it("renders doc page chrome with separated title surface and icon", () => {
    render(<DocPageLayout suiteId="railyard" version="v0.2" slug="players/github-token" />);

    const heading = screen.getByRole("heading", { name: "GitHub Token" });
    const chrome = heading.closest("header")?.querySelector("div.relative.z-10");
    expect(chrome?.className).toContain("rounded-2xl");
    expect(chrome?.className).toContain("border");
    expect(chrome?.className).toContain("bg-background/65");
    expect(chrome?.className).toContain("shadow-sm");

    expect(screen.getByTestId("doc-title-icon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Edit on GitHub/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy page as Markdown" })).not.toBeInTheDocument();
  });

  it("initializes with collapsed docs width when persisted sidebar state is collapsed", () => {
    localStorage.setItem("sbm:docs-sidebar-collapsed", "true");

    const { container } = render(
      <DocPageLayout suiteId="railyard" version="v0.2" slug="players/github-token" />,
    );

    const layoutGrid = container.querySelector(
      '[style*="--docs-sidebar-width"]',
    ) as HTMLElement | null;
    expect(layoutGrid).toBeTruthy();
    expect(layoutGrid?.style.getPropertyValue("--docs-sidebar-width")).toBe("2.75rem");
  });
});
