import { describe, it, expect } from "vitest";
import { filterRegistryItems, collectTags } from "@/features/registry/lib/filter-registry-items";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

function makeItem(overrides: Partial<RegistrySearchItem> = {}): RegistrySearchItem {
  return {
    id: "item-a",
    type: "maps",
    routeSegment: "maps",
    href: "/registry/maps/item-a",
    name: "Item A",
    author: "Test Author",
    authorId: "test-author",
    description: "A test item description",
    tags: ["tag-a"],
    thumbnailSrc: null,
    totalDownloads: 100,
    lastActivityAt: 0,
    cityCode: "TST",
    countryCode: "AA",
    countryName: "Country A",
    countryEmoji: null,
    population: 500000,
    isTest: false,
    manifest: {},
    ...overrides,
  };
}

describe("filterRegistryItems", () => {
  it("returns all items when query and tags are empty", () => {
    const items = [makeItem(), makeItem({ id: "map-2" })];
    expect(filterRegistryItems(items, "", [])).toHaveLength(2);
  });

  it("matches by name", () => {
    const items = [makeItem({ name: "Alpha Item" }), makeItem({ name: "Beta Item" })];
    const result = filterRegistryItems(items, "alpha", []);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("item-a");
  });

  it("matches by tags", () => {
    const items = [makeItem({ tags: ["tag-a", "tag-b"] }), makeItem({ tags: ["tag-c"] })];
    const result = filterRegistryItems(items, "tag-a", []);
    expect(result).toHaveLength(1);
  });

  it("matches by registry-provided search aliases", () => {
    const items = [
      makeItem({ name: "Primary Name", searchAliases: ["Alternate Name"] }),
      makeItem({ id: "item-b", name: "Other Name", searchAliases: ["Second Alternate"] }),
    ];
    const result = filterRegistryItems(items, "alternate name", []);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Primary Name");
  });

  it("filters by selected tags (any may match)", () => {
    const items = [
      makeItem({ tags: ["tag-a", "tag-b"] }),
      makeItem({ id: "item-b", tags: ["tag-a"] }),
      makeItem({ id: "item-c", tags: ["tag-c"] }),
    ];
    const result = filterRegistryItems(items, "", ["tag-a", "tag-b"]);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("item-a");
  });

  it("combines query and tag filter", () => {
    const items = [
      makeItem({ name: "Alpha Item", tags: ["tag-a"] }),
      makeItem({ id: "item-b", name: "Beta Item", tags: ["tag-a"] }),
    ];
    const result = filterRegistryItems(items, "alpha", ["tag-a"]);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Alpha Item");
  });

  it("returns empty array when no items match", () => {
    const items = [makeItem({ name: "Alpha Item" })];
    expect(filterRegistryItems(items, "nonexistent", [])).toHaveLength(0);
  });

  it("clearing filters (empty query, empty tags) returns all items", () => {
    const items = [makeItem(), makeItem({ id: "map-2" })];
    expect(filterRegistryItems(items, "", [])).toHaveLength(2);
  });
});

describe("collectTags", () => {
  it("collects unique tags across items", () => {
    const items = [
      makeItem({ tags: ["tag-a", "tag-b"] }),
      makeItem({ id: "item-b", tags: ["tag-a", "tag-c"] }),
    ];
    const tags = collectTags(items);
    expect(tags).toContain("tag-a");
    expect(tags).toContain("tag-b");
    expect(tags).toContain("tag-c");
    // no duplicates
    expect(tags.filter((t) => t === "tag-a")).toHaveLength(1);
  });

  it("returns sorted tags", () => {
    const items = [makeItem({ tags: ["zebra", "apple", "mango"] })];
    const tags = collectTags(items);
    expect(tags).toEqual([...tags].sort());
  });

  it("returns empty array when no tags", () => {
    const items = [makeItem({ tags: [] })];
    expect(collectTags(items)).toHaveLength(0);
  });
});
