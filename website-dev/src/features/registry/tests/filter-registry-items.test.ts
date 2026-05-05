import { describe, it, expect } from "vitest";
import { filterRegistryItems, collectTags } from "@/features/registry/lib/filter-registry-items";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

function makeItem(overrides: Partial<RegistrySearchItem> = {}): RegistrySearchItem {
  return {
    id: "test-map",
    type: "maps",
    routeSegment: "maps",
    href: "/registry/maps/test-map",
    name: "Test Map",
    author: "Test Author",
    authorId: "test-author",
    description: "A test map description",
    tags: ["east-asia"],
    thumbnailSrc: null,
    totalDownloads: 100,
    lastActivityAt: 0,
    cityCode: "TST",
    countryCode: "KR",
    countryName: "South Korea",
    countryEmoji: "🇰🇷",
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
    const items = [makeItem({ name: "Seoul Metro" }), makeItem({ name: "Bangkok BTS" })];
    const result = filterRegistryItems(items, "seoul", []);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("test-map");
  });

  it("matches by id", () => {
    const items = [makeItem({ id: "gwangju-4" }), makeItem({ id: "toronto" })];
    const result = filterRegistryItems(items, "gwangju", []);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("gwangju-4");
  });

  it("matches by author", () => {
    const items = [makeItem({ author: "kimth9" }), makeItem({ author: "Bobby-047" })];
    const result = filterRegistryItems(items, "kimth9", []);
    expect(result).toHaveLength(1);
  });

  it("matches by description", () => {
    const items = [
      makeItem({ description: "Korean map with traffic data" }),
      makeItem({ description: "A generic map" }),
    ];
    const result = filterRegistryItems(items, "korean", []);
    expect(result).toHaveLength(1);
  });

  it("matches by tags", () => {
    const items = [makeItem({ tags: ["east-asia", "korea"] }), makeItem({ tags: ["europe"] })];
    const result = filterRegistryItems(items, "east-asia", []);
    expect(result).toHaveLength(1);
  });

  it("matches maps by city code", () => {
    const items = [makeItem({ cityCode: "KWJ4" }), makeItem({ cityCode: "BUS3" })];
    const result = filterRegistryItems(items, "kwj4", []);
    expect(result).toHaveLength(1);
  });

  it("matches maps by country name", () => {
    const items = [makeItem({ countryName: "South Korea" }), makeItem({ countryName: "Japan" })];
    const result = filterRegistryItems(items, "south korea", []);
    expect(result).toHaveLength(1);
  });

  it("filters by selected tags (any may match)", () => {
    const items = [
      makeItem({ tags: ["east-asia", "korea"] }),
      makeItem({ id: "map-2", tags: ["east-asia"] }),
      makeItem({ id: "map-3", tags: ["europe"] }),
    ];
    const result = filterRegistryItems(items, "", ["east-asia", "korea"]);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("test-map");
  });

  it("combines query and tag filter", () => {
    const items = [
      makeItem({ name: "Seoul Metro", tags: ["east-asia"] }),
      makeItem({ id: "bts", name: "Bangkok BTS", tags: ["east-asia"] }),
    ];
    const result = filterRegistryItems(items, "seoul", ["east-asia"]);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Seoul Metro");
  });

  it("returns empty array when no items match", () => {
    const items = [makeItem({ name: "Seoul" })];
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
      makeItem({ tags: ["east-asia", "korea"] }),
      makeItem({ id: "map-2", tags: ["east-asia", "japan"] }),
    ];
    const tags = collectTags(items);
    expect(tags).toContain("east-asia");
    expect(tags).toContain("korea");
    expect(tags).toContain("japan");
    // no duplicates
    expect(tags.filter((t) => t === "east-asia")).toHaveLength(1);
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
