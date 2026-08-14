import { describe, expect, it } from "vitest";
import { getDocsTree, getAllNodes } from "@/features/docs/lib/content";

describe("flat-slug grouping keeps URLs", () => {
  it("registry pages keep their top-level routePath", () => {
    const tree = getDocsTree("registry", null);
    const map = new Map(getAllNodes(tree).map((n) => [n.key, n.routePath]));
    for (const key of [
      "publishing-content",
      "updating-content",
      "deprecation",
      "retiring-versions",
      "using-custom-url",
      "manifest-requirements",
      "collaborators",
      "caretakers",
      "dependencies",
      "author-attribution",
      "tagging",
      "markdown-playground",
    ]) {
      expect(map.get(key), key).toBe(`/registry/docs/${key}`);
    }
    expect(map.get("overview")).toBe("/registry/docs/data-quality/overview");
  });

  it("railyard pages keep their versioned routePath", () => {
    const tree = getDocsTree("railyard", "v0.2");
    const map = new Map(getAllNodes(tree).map((n) => [n.key, n.routePath]));
    for (const key of [
      "profile-management",
      "importing-local-assets",
      "listing-status-and-filters",
      "country-flag-emojis",
      "game-version-incompatibility",
      "github-token",
      "troubleshooting-railyard",
    ]) {
      expect(map.get(key), key).toBe(`/railyard/docs/v0.2/${key}`);
    }
    expect(map.get("windows")).toBe("/railyard/docs/v0.2/installing-railyard/windows");
  });
});
