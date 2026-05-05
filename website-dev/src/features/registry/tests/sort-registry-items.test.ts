import { describe, it, expect } from "vitest";
import { sortRegistryItems } from "@/features/registry/lib/sort-registry-items";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

function makeItem(overrides: Partial<RegistrySearchItem> = {}): RegistrySearchItem {
  return {
    id: "item-1",
    type: "maps",
    routeSegment: "maps",
    href: "/registry/maps/item-1",
    name: "Item One",
    author: "Author A",
    authorId: "author-a",
    description: "",
    tags: [],
    thumbnailSrc: null,
    totalDownloads: 100,
    lastActivityAt: 1_000_000,
    cityCode: "AAA",
    countryCode: "US",
    countryName: "United States",
    countryEmoji: "🇺🇸",
    population: 1_000_000,
    isTest: false,
    manifest: {},
    ...overrides,
  };
}

const SEED = 42;

describe("sortRegistryItems", () => {
  it("sorts by lastUpdated descending", () => {
    const items = [
      makeItem({ id: "a", lastActivityAt: 500 }),
      makeItem({ id: "b", lastActivityAt: 1000 }),
      makeItem({ id: "c", lastActivityAt: 750 }),
    ];
    const result = sortRegistryItems(items, "lastUpdated", "desc", SEED);
    expect(result.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by lastUpdated ascending", () => {
    const items = [
      makeItem({ id: "a", lastActivityAt: 500 }),
      makeItem({ id: "b", lastActivityAt: 1000 }),
    ];
    const result = sortRegistryItems(items, "lastUpdated", "asc", SEED);
    expect(result[0]?.id).toBe("a");
    expect(result[1]?.id).toBe("b");
  });

  it("sorts by downloads descending", () => {
    const items = [
      makeItem({ id: "a", totalDownloads: 50 }),
      makeItem({ id: "b", totalDownloads: 200 }),
      makeItem({ id: "c", totalDownloads: 100 }),
    ];
    const result = sortRegistryItems(items, "downloads", "desc", SEED);
    expect(result.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by name ascending", () => {
    const items = [
      makeItem({ id: "a", name: "Zurich" }),
      makeItem({ id: "b", name: "Amsterdam" }),
      makeItem({ id: "c", name: "Montreal" }),
    ];
    const result = sortRegistryItems(items, "name", "asc", SEED);
    expect(result[0]?.name).toBe("Amsterdam");
    expect(result[2]?.name).toBe("Zurich");
  });

  it("sorts by name descending", () => {
    const items = [makeItem({ id: "a", name: "Zurich" }), makeItem({ id: "b", name: "Amsterdam" })];
    const result = sortRegistryItems(items, "name", "desc", SEED);
    expect(result[0]?.name).toBe("Zurich");
  });

  it("sorts by author", () => {
    const items = [makeItem({ id: "a", author: "Zara" }), makeItem({ id: "b", author: "Adam" })];
    const result = sortRegistryItems(items, "author", "asc", SEED);
    expect(result[0]?.author).toBe("Adam");
  });

  it("sorts by population (maps-only field)", () => {
    const items = [
      makeItem({ id: "a", population: 5_000_000 }),
      makeItem({ id: "b", population: 1_000_000 }),
      makeItem({ id: "c", population: 3_000_000 }),
    ];
    const result = sortRegistryItems(items, "population", "desc", SEED);
    expect(result[0]?.id).toBe("a");
    expect(result[2]?.id).toBe("b");
  });

  it("sorts by cityCode", () => {
    const items = [makeItem({ id: "a", cityCode: "ZZZ" }), makeItem({ id: "b", cityCode: "AAA" })];
    const result = sortRegistryItems(items, "cityCode", "asc", SEED);
    expect(result[0]?.id).toBe("b");
  });

  it("sorts by country", () => {
    const items = [
      makeItem({ id: "a", countryName: "Zimbabwe" }),
      makeItem({ id: "b", countryName: "Argentina" }),
    ];
    const result = sortRegistryItems(items, "country", "asc", SEED);
    expect(result[0]?.id).toBe("b");
  });

  it("random sort produces a deterministic shuffle for same seed", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem({ id: `item-${i}` }));
    const a = sortRegistryItems(items, "random", "asc", 999);
    const b = sortRegistryItems(items, "random", "asc", 999);
    expect(a.map((i) => i.id)).toEqual(b.map((i) => i.id));
  });

  it("random sort with different seeds produces different orders", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem({ id: `item-${i}` }));
    const a = sortRegistryItems(items, "random", "asc", 1);
    const b = sortRegistryItems(items, "random", "asc", 2);
    // With 10 items it's virtually impossible for both shuffles to be identical
    expect(a.map((i) => i.id)).not.toEqual(b.map((i) => i.id));
  });

  it("nulls sort last when ascending", () => {
    const items = [
      makeItem({ id: "a", population: null }),
      makeItem({ id: "b", population: 500_000 }),
    ];
    const result = sortRegistryItems(items, "population", "asc", SEED);
    expect(result[0]?.id).toBe("b");
    expect(result[1]?.id).toBe("a");
  });

  it("direction toggle reverses order for deterministic sorts", () => {
    const items = [
      makeItem({ id: "a", totalDownloads: 10 }),
      makeItem({ id: "b", totalDownloads: 100 }),
    ];
    const asc = sortRegistryItems(items, "downloads", "asc", SEED);
    const desc = sortRegistryItems(items, "downloads", "desc", SEED);
    expect(asc[0]?.id).toBe("a");
    expect(desc[0]?.id).toBe("b");
  });
});
