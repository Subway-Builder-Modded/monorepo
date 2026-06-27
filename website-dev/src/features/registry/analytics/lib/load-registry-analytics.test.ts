import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  filterRegistryAnalyticsHistory,
  loadRegistryAnalyticsData,
  sumRegistryAnalyticsHistory,
} from "./load-registry-analytics";

vi.mock("@/features/registry/authors/lib/load-creator-database", () => ({
  loadCreatorDatabaseData: () =>
    Promise.resolve({
      authors: [{ id: "author-a" }, { id: "author-b" }],
      projects: [],
    }),
}));

vi.mock("@/features/registry/lib/load-registry-cache", () => ({
  loadRegistryItemsForType: (typeId: string) =>
    Promise.resolve(
      typeId === "maps"
        ? [
            { id: "map-a", type: "maps", totalDownloads: 10 },
            { id: "map-b", type: "maps", totalDownloads: 20 },
          ]
        : [{ id: "mod-a", type: "mods", totalDownloads: 5 }],
    ),
}));

const analyticsCsv = [
  "snapshot_date,total_downloads,maps,mods,total_downloads_clamped,maps_clamped,mods_clamped,cumulative_total,cumulative_maps,cumulative_mods,total_new_assets,new_maps,new_mods",
  "2026_03_11,10,8,2,10,8,2,10,8,2,3,2,1",
  "2026_03_12,12,7,5,12,7,5,22,15,7,1,1,0",
  "2026_03_13,9,4,5,9,4,5,31,19,12,2,1,1",
].join("\n");

describe("loadRegistryAnalyticsData", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(analyticsCsv),
        }),
      ),
    );
  });

  it("loads registry analytics overview and daily history from the cache", async () => {
    const data = await loadRegistryAnalyticsData();

    expect(data.overview).toMatchObject({
      downloads: 35,
      listings: 3,
      authors: 2,
      maps: { listings: 2, downloads: 30 },
      mods: { listings: 1, downloads: 5 },
    });
    expect(data.history).toHaveLength(3);
    expect(data.history[0]).toMatchObject({
      date: "2026-03-11",
      downloads: { total: 10, maps: 8, mods: 2 },
      listings: { total: 3, maps: 2, mods: 1 },
    });
  });

  it("filters and sums analytics history by selected period", async () => {
    const data = await loadRegistryAnalyticsData();
    const history = filterRegistryAnalyticsHistory(data.history, "3d");
    const totals = sumRegistryAnalyticsHistory(history);

    expect(history.map((row) => row.date)).toEqual(["2026-03-11", "2026-03-12", "2026-03-13"]);
    expect(totals.downloads).toEqual({ total: 31, maps: 19, mods: 12 });
    expect(totals.listings).toEqual({ total: 6, maps: 4, mods: 2 });
  });
});
