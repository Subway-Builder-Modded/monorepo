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

  it("renders the eyebrow label, suite badge on its own row, and a content-height sticky surface (no internal scroll panel)", () => {
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

    expect(screen.getByText("Documentation")).toBeInTheDocument();
    expect(screen.getByText("Railyard")).toBeInTheDocument();

    const badge = document.querySelector('[data-slot="suite-badge"]') as HTMLElement | null;
    expect(badge).toBeTruthy();
    // Badge gets a full-width row to itself so the suite title can never be
    // squeezed/truncated by the collapse button next to it.
    expect(badge?.className).toContain("w-full");
    expect(badge?.parentElement?.className).toContain("block");

    const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });
    // Collapse button must not claim inline space inside any row that holds the
    // badge: it is absolutely positioned in the card's top-right corner.
    expect(collapseBtn.className).toContain("absolute");
    const badgeRow = badge?.parentElement;
    expect(badgeRow?.contains(collapseBtn)).toBe(false);

    const nav = screen.getByLabelText("Documentation navigation");
    // The nav must NOT be the inner scroll-panel of a fixed-height card.
    expect(nav.className).not.toContain("overflow-y-auto");
    expect(nav.className).not.toContain("max-h");

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
