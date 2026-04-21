import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { DocPageLayout } from "@/app/features/docs/components/doc-page-layout";

vi.mock("@/app/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/features/docs/components/sidebar", () => ({
  DocsSidebar: () => <aside data-testid="docs-sidebar" />,
  MobileDocsSidebar: () => <div data-testid="mobile-docs-sidebar" />,
}));

vi.mock("@/app/features/docs/components/on-this-page", () => ({
  OnThisPage: () => <aside data-testid="on-this-page" />,
}));

vi.mock("@/app/features/docs/lib/icon-resolver", () => ({
  resolveIcon: () => (props: { className?: string }) => (
    <svg data-testid="doc-title-icon" {...props} />
  ),
}));

vi.mock("@/app/features/docs/lib/headings", () => ({
  extractHeadings: () => [
    { id: "intro", text: "Intro", level: 2 },
    { id: "setup", text: "Setup", level: 3 },
  ],
}));

vi.mock("@/app/features/docs/lib/content", () => ({
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
    sourcePath: `/content/docs/railyard/v0.2/${slug}.mdx`,
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
  getDocSourcePath: vi.fn(() => "/content/docs/railyard/v0.2/players/github-token.mdx"),
  getEditUrl: vi.fn(
    () =>
      "https://github.com/Subway-Builder-Modded/monorepo/edit/main/website-dev/content/docs/railyard/v0.2/players/github-token.mdx",
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
    const chrome = heading.closest("header");
    expect(chrome?.className).toContain("rounded-2xl");
    expect(chrome?.className).toContain("border");
    expect(chrome?.className).toContain("var(--suite-accent-light)");

    expect(screen.getByTestId("doc-title-icon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Edit on GitHub/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy page as Markdown" })).not.toBeInTheDocument();
  });
});
