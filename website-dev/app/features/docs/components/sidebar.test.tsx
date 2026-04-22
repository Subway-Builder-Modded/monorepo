import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { DocsSidebar } from "@/app/features/docs/components/sidebar";
import type { DocsTree, DocsTreeNode } from "@/app/features/docs/lib/types";

function makeNode(overrides: Partial<DocsTreeNode> & { slug: string }): DocsTreeNode {
  return {
    kind: "page",
    key: overrides.slug.split("/").pop() ?? "node",
    slug: overrides.slug,
    routePath: `/railyard/docs/v0.2/${overrides.slug}`,
    sourcePath: `/content/docs/railyard/v0.2/${overrides.slug}.mdx`,
    frontmatter: {
      title: overrides.slug,
      description: "",
      icon: "FileText",
    },
    suiteId: "railyard",
    version: "v0.2",
    children: [],
    depth: 0,
    ...overrides,
  };
}

function makeTree(nodes: DocsTreeNode[]): DocsTree {
  return {
    suiteId: "railyard",
    version: "v0.2",
    nodes,
  };
}

describe("DocsSidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders sticky side-rail structure with title+badge header and bottom collapse action", () => {
    render(
      <DocsSidebar
        tree={makeTree([
          makeNode({
            slug: "players",
            frontmatter: { title: "Players", description: "", icon: "FileText" },
          }),
        ])}
        suiteId="railyard"
        currentVersion="v0.2"
        currentSlug="players"
      />,
    );

    // Title text is present as a proper label alongside the suite badge.
    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("Railyard")).toBeInTheDocument();

    const badge = document.querySelector('[data-slot="suite-badge"]') as HTMLElement | null;
    expect(badge).toBeTruthy();
    // Badge stays inline beside title, not stretched as full-row chrome.
    expect(badge?.className).not.toContain("w-full");

    const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(collapseBtn.textContent).toContain("Collapse Sidebar");
    expect(collapseBtn.className).not.toContain("absolute");

    const nav = screen.getByLabelText("Documentation navigation");
    const shell = nav.closest(".sticky");
    expect(shell).toBeTruthy();
    expect(shell?.className).toContain("self-start");

    // Divider and button are after the navigation area.
    const navEnd = nav.compareDocumentPosition(collapseBtn);
    expect(navEnd & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not use fixed-height or internal-scroll desktop sidebar model", () => {
    render(
      <DocsSidebar
        tree={makeTree([
          makeNode({
            slug: "players",
            frontmatter: { title: "Players", description: "", icon: "FileText" },
          }),
        ])}
        suiteId="railyard"
        currentVersion="v0.2"
        currentSlug="players"
      />,
    );

    const nav = screen.getByLabelText("Documentation navigation");
    expect(nav.className).not.toContain("overflow-y-auto");
    expect(nav.className).not.toContain("max-h");

    const stickyFrame = nav.closest(".sticky");
    expect(stickyFrame?.className).toContain("sticky");
    expect(stickyFrame?.className).not.toContain("max-h");
    expect(stickyFrame?.className).not.toContain("overflow");
  });

  it("supports collapse/expand flow with compact sticky expand rail", async () => {
    const user = userEvent.setup();

    render(
      <DocsSidebar
        tree={makeTree([
          makeNode({
            slug: "players",
            frontmatter: { title: "Players", description: "", icon: "FileText" },
          }),
        ])}
        suiteId="railyard"
        currentVersion="v0.2"
        currentSlug="players"
      />,
    );

    const initialSidebar = screen.getByLabelText("Documentation navigation").closest("aside");
    expect(initialSidebar?.className).not.toContain("slide-in-from-left-96");

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    const expand = screen.getByRole("button", { name: "Expand sidebar" });
    expect(expand).toBeInTheDocument();
    expect(expand.className).not.toContain("absolute");

    await user.click(expand);
    const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(collapse).toBeInTheDocument();

    const expandedSidebar = screen.getByLabelText("Documentation navigation").closest("aside");
    expect(expandedSidebar?.className).toContain("slide-in-from-left-96");
  });

  it("keeps hover row structure across label and chevron region", () => {
    const parent = makeNode({
      slug: "players",
      kind: "landing",
      frontmatter: { title: "Players", description: "", icon: "FileText" },
      children: [
        makeNode({
          slug: "players/github-token",
          frontmatter: { title: "GitHub Token", description: "", icon: "FileText" },
          depth: 1,
        }),
      ],
    });

    render(
      <DocsSidebar
        tree={makeTree([parent])}
        suiteId="railyard"
        currentVersion="v0.2"
        currentSlug="players"
      />,
    );

    const link = screen.getByRole("link", { name: "Players" });
    const row = link.closest("[class*='group/row']");
    expect(row).toBeTruthy();

    const toggle = screen.getByRole("button", { name: "Collapse section" });
    expect(row?.contains(toggle)).toBe(true);
  });

  it("inherits active parent styling when child is active and parent is collapsed, then restores child state", async () => {
    const user = userEvent.setup();
    const parent = makeNode({
      slug: "players",
      kind: "landing",
      frontmatter: { title: "Players", description: "", icon: "FileText" },
      children: [
        makeNode({
          slug: "players/github-token",
          frontmatter: { title: "GitHub Token", description: "", icon: "FileText" },
          depth: 1,
        }),
      ],
    });

    render(
      <DocsSidebar
        tree={makeTree([parent])}
        suiteId="railyard"
        currentVersion="v0.2"
        currentSlug="players/github-token"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Collapse section" }));

    const parentLink = screen.getByRole("link", { name: "Players" });
    const parentRow = parentLink.closest("[class*='group/row']");
    expect(parentRow?.className).toContain("var(--suite-accent-light)");

    await user.click(screen.getByRole("button", { name: "Expand section" }));

    const childLink = screen.getByRole("link", { name: "GitHub Token" });
    expect(childLink).toHaveAttribute("aria-current", "page");
  });
});
