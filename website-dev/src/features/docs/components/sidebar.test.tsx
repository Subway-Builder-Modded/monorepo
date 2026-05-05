import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { DocsSidebar } from "@/features/docs/components/sidebar";
import type { DocsTree, DocsTreeNode } from "@/features/docs/lib/types";

function makeNode(overrides: Partial<DocsTreeNode> & { slug: string }): DocsTreeNode {
  const { slug, ...rest } = overrides;

  return {
    kind: "page",
    key: slug.split("/").pop() ?? "node",
    slug,
    routePath: `/railyard/docs/v0.2/${slug}`,
    sourcePath: `/content/railyard/docs/v0.2/${slug}.mdx`,
    frontmatter: {
      title: slug,
      description: "",
      icon: "FileText",
    },
    suiteId: "railyard",
    version: "v0.2",
    children: [],
    depth: 0,
    ...rest,
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

    const collapseBtn = screen.getByRole("button", { name: "Collapse Sidebar" });
    expect(collapseBtn.textContent).toContain("Collapse Sidebar");
    expect(collapseBtn.className).not.toContain("absolute");

    const nav = document.querySelector("nav") as HTMLElement;
    expect(nav).toBeTruthy();
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

    const nav = document.querySelector("nav") as HTMLElement;
    expect(nav).toBeTruthy();
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

    const initialSidebar = document.querySelector("nav")?.closest("aside");
    expect(initialSidebar?.className).not.toContain("slide-in-from-left-96");

    await user.click(screen.getByRole("button", { name: "Collapse Sidebar" }));
    const expand = screen.getByRole("button");
    expect(expand).toBeInTheDocument();
    expect(expand.className).not.toContain("absolute");

    await user.click(expand);
    const collapse = screen.getByRole("button", { name: "Collapse Sidebar" });
    expect(collapse).toBeInTheDocument();

    const expandedSidebar = document.querySelector("nav")?.closest("aside");
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

    const toggle = row?.querySelector("button") as HTMLButtonElement;
    expect(toggle).toBeTruthy();
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

    await user.click(screen.getAllByRole("button")[0]);

    const parentLink = screen.getByRole("link", { name: "Players" });
    const parentRow = parentLink.closest("[class*='group/row']");
    expect(parentRow?.className).toContain("var(--suite-accent-light)");

    await user.click(screen.getAllByRole("button")[0]);

    const childLink = screen.getByRole("link", { name: "GitHub Token" });
    expect(childLink).toHaveAttribute("aria-current", "page");
  });
});
