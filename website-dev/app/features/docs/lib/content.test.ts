import { describe, expect, it } from "vite-plus/test";
import {
  findTreeNode,
  getVisibleNodes,
  getAllNodes,
  getDocSourcePath,
} from "@/app/features/docs/lib/content";
import type { DocsTree, DocsTreeNode } from "@/app/features/docs/lib/types";

function makeNode(overrides: Partial<DocsTreeNode> & { slug: string }): DocsTreeNode {
  return {
    kind: "page",
    key: overrides.slug.split("/").pop()!,
    slug: overrides.slug,
    routePath: `/railyard/docs/v0.2/${overrides.slug}`,
    sourcePath: `/content/docs/railyard/v0.2/${overrides.slug}.mdx`,
    frontmatter: { title: overrides.slug, description: "", icon: "FileText" },
    suiteId: "railyard",
    version: "v0.2",
    children: [],
    depth: 0,
    ...overrides,
  };
}

function makeTree(nodes: DocsTreeNode[]): DocsTree {
  return { suiteId: "railyard", version: "v0.2", nodes };
}

describe("findTreeNode", () => {
  it("finds a top-level node by slug", () => {
    const tree = makeTree([makeNode({ slug: "players" }), makeNode({ slug: "getting-started" })]);
    const found = findTreeNode(tree, "players");
    expect(found).not.toBeNull();
    expect(found!.slug).toBe("players");
  });

  it("finds a deeply nested node", () => {
    const child = makeNode({ slug: "players/github-token", depth: 1 });
    const parent = makeNode({
      slug: "players",
      kind: "landing",
      children: [child],
    });
    const tree = makeTree([parent]);
    const found = findTreeNode(tree, "players/github-token");
    expect(found).not.toBeNull();
    expect(found!.slug).toBe("players/github-token");
  });

  it("returns null for non-existent slug", () => {
    const tree = makeTree([makeNode({ slug: "players" })]);
    expect(findTreeNode(tree, "nonexistent")).toBeNull();
  });

  it("returns null for empty tree", () => {
    const tree = makeTree([]);
    expect(findTreeNode(tree, "anything")).toBeNull();
  });
});

describe("getVisibleNodes", () => {
  it("filters out hidden nodes", () => {
    const visible = makeNode({ slug: "players" });
    const hidden = makeNode({
      slug: "hidden-page",
      frontmatter: { title: "Hidden", description: "", icon: "FileText", hidden: true },
    });
    const result = getVisibleNodes([visible, hidden]);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("players");
  });

  it("returns all nodes when none are hidden", () => {
    const nodes = [makeNode({ slug: "a" }), makeNode({ slug: "b" })];
    expect(getVisibleNodes(nodes)).toHaveLength(2);
  });

  it("returns empty array when all hidden", () => {
    const hidden = makeNode({
      slug: "x",
      frontmatter: { title: "X", description: "", icon: "FileText", hidden: true },
    });
    expect(getVisibleNodes([hidden])).toHaveLength(0);
  });
});

describe("getAllNodes", () => {
  it("flattens nested tree into array", () => {
    const grandchild = makeNode({ slug: "players/installing/windows", depth: 2 });
    const child = makeNode({
      slug: "players/installing",
      kind: "landing",
      depth: 1,
      children: [grandchild],
    });
    const parent = makeNode({
      slug: "players",
      kind: "landing",
      children: [child],
    });
    const tree = makeTree([parent, makeNode({ slug: "getting-started" })]);
    const all = getAllNodes(tree);
    expect(all).toHaveLength(4);
    expect(all.map((n) => n.slug)).toEqual([
      "players",
      "players/installing",
      "players/installing/windows",
      "getting-started",
    ]);
  });

  it("returns empty array for empty tree", () => {
    expect(getAllNodes(makeTree([]))).toEqual([]);
  });
});

describe("getDocSourcePath", () => {
  it("builds correct source path", () => {
    expect(getDocSourcePath("railyard", "v0.2", "players/github-token")).toBe(
      "/content/docs/railyard/v0.2/players/github-token.mdx",
    );
  });

  it("builds path for root-level doc", () => {
    expect(getDocSourcePath("template-mod", "v1.0", "getting-started")).toBe(
      "/content/docs/template-mod/v1.0/getting-started.mdx",
    );
  });
});
