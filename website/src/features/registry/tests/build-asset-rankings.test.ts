import { describe, expect, it } from "vitest";
import { buildAssetRankings } from "@/features/registry/authors/lib/build-asset-rankings";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

function makeItem(id: string, type: "maps" | "mods", totalDownloads: number): RegistrySearchItem {
  return {
    id,
    type,
    routeSegment: type,
    href: `/registry/${type}/${id}`,
    name: id,
    author: "author-a",
    authorId: "author-a",
    description: "",
    tags: [],
    searchAliases: [],
    thumbnailSrc: null,
    totalDownloads,
    lastActivityAt: 0,
    latestVersion: null,
    latestVersionUpdatedAt: 0,
    manifest: {},
  } as unknown as RegistrySearchItem;
}

const allItemsByType = {
  maps: [makeItem("map-a", "maps", 100), makeItem("map-b", "maps", 40)],
  mods: [makeItem("mod-a", "mods", 70)],
};
const entityItemsByType = {
  maps: [allItemsByType.maps[1]],
  mods: [allItemsByType.mods[0]],
};

// map-b outsells map-a inside the 7-day window but not all time.
const dailyRows = [
  { listing_type: "map", id: "map-a", "2026_03_11": "60", "2026_03_12": "1" },
  { listing_type: "map", id: "map-b", "2026_03_11": "5", "2026_03_12": "9" },
  { listing_type: "mod", id: "mod-a", "2026_03_11": "0", "2026_03_12": "4" },
];

describe("buildAssetRankings", () => {
  it("ranks the all-time cut on lifetime downloads across every registry listing", () => {
    const rankings = buildAssetRankings(entityItemsByType, allItemsByType, dailyRows);

    expect(rankings["all-time"].maps).toEqual([
      expect.objectContaining({ id: "map-b", typeId: "maps", downloads: 40, rank: 2 }),
    ]);
    // "total" ranks against maps and mods together, so map-b sits behind mod-a.
    expect(rankings["all-time"].total.map((row) => [row.id, row.rank])).toEqual([
      ["map-b", 3],
      ["mod-a", 2],
    ]);
  });

  it("ranks shorter cuts on the trailing window instead of lifetime downloads", () => {
    const rankings = buildAssetRankings(entityItemsByType, allItemsByType, dailyRows);

    expect(rankings["1d"].total.map((row) => [row.id, row.downloads, row.rank])).toEqual([
      ["map-b", 9, 1],
      ["mod-a", 4, 2],
    ]);
    expect(rankings["7d"].maps).toEqual([
      expect.objectContaining({ id: "map-b", downloads: 14, rank: 2 }),
    ]);
  });

  it("leaves a listing unranked when it saw no downloads in the window", () => {
    const rankings = buildAssetRankings(entityItemsByType, allItemsByType, [
      { listing_type: "map", id: "map-a", "2026_03_12": "3" },
    ]);

    expect(rankings["1d"].maps).toEqual([
      expect.objectContaining({ id: "map-b", downloads: 0, rank: null }),
    ]);
  });
});
