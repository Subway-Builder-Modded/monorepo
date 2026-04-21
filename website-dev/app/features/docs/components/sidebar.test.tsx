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

  it("renders title+badge header and moves collapse button to the bottom with label text", () => {
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
    // Badge is NOT full-width – it sits inline beside the title text.
    expect(badge?.className).not.toContain("w-full");

    // Collapse button must NOT be absolutely positioned inside the header.
    const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(collapseBtn.className).not.toContain("absolute");
    // Collapse button must carry visible label text (icon + "Collapse Sidebar").
    expect(collapseBtn.textContent).toContain("Collapse Sidebar");

    // The header region (parent of the badge) must NOT also contain the collapse button.
    const headerDiv = badge?.closest(".border-b");
    expect(headerDiv?.contains(collapseBtn)).toBe(false);

    // The nav must not be an internal-scroll box.
    const nav = screen.getByLabelText("Documentation navigation");
    expect(nav.className).not.toContain("overflow-y-auto");
    expect(nav.className).not.toContain("max-h");

    // The sticky card must be content-height (no max-h, no overflow on the frame).
    const stickyFrame = nav.parentElement;
    expect(stickyFrame?.className).toContain("sticky");
    expect(stickyFrame?.className).toContain("self-start");
    expect(stickyFrame?.className).not.toContain("max-h");
    expect(stickyFrame?.className).not.toContain("overflow");
  });

  it("supports collapse/expand flow with floating expand trigger", async () => {
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

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
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
