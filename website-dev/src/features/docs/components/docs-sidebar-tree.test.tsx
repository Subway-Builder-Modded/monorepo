import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DocsSidebarTree,
  nodeIsActiveInMiniRail,
  sidebarNodeHasActiveDescendant,
} from "@/features/docs/components/docs-sidebar-tree";
import type { DocsTreeNode } from "@/features/docs/lib/types";

vi.mock("@/features/docs/lib/icon-resolver", () => ({
  resolveIcon: () =>
    function MockIcon({ className }: { className?: string }) {
      return <span className={className} />;
    },
}));

vi.mock("@/lib/router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function makeNode(
  slug: string,
  children: DocsTreeNode[] = [],
  overrides: Partial<DocsTreeNode> = {},
): DocsTreeNode {
  return {
    kind: "page",
    key: slug,
    slug,
    routePath: `/${slug}`,
    sourcePath: `content/${slug}.mdx`,
    frontmatter: { title: slug, description: "", icon: "File", hidden: false },
    suiteId: "railyard",
    version: "v0.2",
    depth: 0,
    children,
    ...overrides,
  };
}

// --- sidebarNodeHasActiveDescendant ---

describe("sidebarNodeHasActiveDescendant", () => {
  it("returns false when node has no children", () => {
    const node = makeNode("root");
    expect(sidebarNodeHasActiveDescendant(node, "root")).toBe(false);
  });

  it("returns true when a direct child matches currentSlug", () => {
    const child = makeNode("child");
    const node = makeNode("root", [child]);
    expect(sidebarNodeHasActiveDescendant(node, "child")).toBe(true);
  });

  it("returns true for a nested descendant", () => {
    const grandchild = makeNode("grandchild");
    const child = makeNode("child", [grandchild]);
    const node = makeNode("root", [child]);
    expect(sidebarNodeHasActiveDescendant(node, "grandchild")).toBe(true);
  });

  it("returns false when no children match", () => {
    const child = makeNode("child");
    const node = makeNode("root", [child]);
    expect(sidebarNodeHasActiveDescendant(node, "other")).toBe(false);
  });

  it("skips hidden children", () => {
    const hiddenChild = makeNode("hidden-child", [], {
      frontmatter: { title: "hidden-child", description: "", icon: "File", hidden: true },
    });
    const node = makeNode("root", [hiddenChild]);
    expect(sidebarNodeHasActiveDescendant(node, "hidden-child")).toBe(false);
  });
});

// --- nodeIsActiveInMiniRail ---

describe("nodeIsActiveInMiniRail", () => {
  it("returns true when node itself is current", () => {
    const node = makeNode("root");
    expect(nodeIsActiveInMiniRail(node, "root")).toBe(true);
  });

  it("returns true when a descendant is current", () => {
    const child = makeNode("child");
    const node = makeNode("root", [child]);
    expect(nodeIsActiveInMiniRail(node, "child")).toBe(true);
  });

  it("returns false when neither self nor descendants match", () => {
    const child = makeNode("child");
    const node = makeNode("root", [child]);
    expect(nodeIsActiveInMiniRail(node, "other")).toBe(false);
  });

  it("returns false when currentSlug is null", () => {
    const node = makeNode("root");
    expect(nodeIsActiveInMiniRail(node, null)).toBe(false);
  });
});

// --- DocsSidebarTree component ---

describe("DocsSidebarTree", () => {
  it("renders link text for each node", () => {
    const nodes = [makeNode("getting-started"), makeNode("configuration")];
    const onToggle = vi.fn();

    render(
      <DocsSidebarTree
        nodes={nodes}
        currentSlug={null}
        collapsed={new Set()}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByRole("link", { name: "getting-started" })).toBeVisible();
    expect(screen.getByRole("link", { name: "configuration" })).toBeVisible();
  });

  it("applies aria-current=page to the active node link", () => {
    const nodes = [makeNode("getting-started"), makeNode("configuration")];
    const onToggle = vi.fn();

    render(
      <DocsSidebarTree
        nodes={nodes}
        currentSlug="getting-started"
        collapsed={new Set()}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByRole("link", { name: "getting-started" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "configuration" })).not.toHaveAttribute("aria-current");
  });

  it("shows expand/collapse button for nodes with children", () => {
    const child = makeNode("child");
    const parent = makeNode("parent", [child]);
    const onToggle = vi.fn();

    render(
      <DocsSidebarTree
        nodes={[parent]}
        currentSlug={null}
        collapsed={new Set()}
        onToggle={onToggle}
      />,
    );

    const toggleButton = screen.getByRole("button", { name: "Collapse section" });
    expect(toggleButton).toBeVisible();
  });

  it("calls onToggle with the node slug when expand/collapse is clicked", () => {
    const child = makeNode("child");
    const parent = makeNode("parent", [child]);
    const onToggle = vi.fn();

    render(
      <DocsSidebarTree
        nodes={[parent]}
        currentSlug={null}
        collapsed={new Set()}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Collapse section" }));
    expect(onToggle).toHaveBeenCalledWith("parent");
  });

  it("shows Expand section label when node is collapsed", () => {
    const child = makeNode("child");
    const parent = makeNode("parent", [child]);
    const onToggle = vi.fn();

    render(
      <DocsSidebarTree
        nodes={[parent]}
        currentSlug={null}
        collapsed={new Set(["parent"])}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByRole("button", { name: "Expand section" })).toBeVisible();
  });
});
