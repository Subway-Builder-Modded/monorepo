import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  filterRegistryAnalyticsHistory,
  loadRegistryAnalyticsData,
  sumRegistryAnalyticsHistory,
} from "./load-registry-analytics";

vi.mock("@/features/registry/authors/lib/load-creator-database", () => ({
  loadCreatorDatabaseData: () =>
    Promise.resolve({
      authors: [
        {
          id: "author-a",
          label: "Author A",
          href: "/registry/authors/author-a",
          downloads: 30,
          maps: 2,
          mods: 1,
          assets: 3,
          collaborations: 0,
        },
        {
          id: "author-b",
          label: "Author B",
          href: "/registry/authors/author-b",
          downloads: 5,
          maps: 0,
          mods: 1,
          assets: 1,
          collaborations: 0,
        },
      ],
      projects: [
        {
          id: "author-a/project-a",
          name: "Project A",
          href: "/registry/authors/author-a/project-a",
          downloads: 30,
          maps: 2,
          mods: 1,
          assets: 3,
        },
      ],
    }),
}));

vi.mock("@/features/registry/lib/load-registry-cache", () => ({
  loadRegistryItemsForType: (typeId: string) =>
    Promise.resolve(
      typeId === "maps"
        ? [
            {
              id: "map-a",
              type: "maps",
              totalDownloads: 10,
              manifest: {
                grid_statistics: {
                  detail: {
                    playableAreaKm2: 42,
                  },
                },
              },
            },
            { id: "map-b", type: "maps", totalDownloads: 20, manifest: {} },
          ]
        : [{ id: "mod-a", type: "mods", totalDownloads: 5, manifest: {} }],
    ),
}));

const analyticsCsv = [
  "snapshot_date,total_downloads,maps,mods,total_downloads_clamped,maps_clamped,mods_clamped,cumulative_total,cumulative_maps,cumulative_mods,total_new_assets,new_maps,new_mods",
  "2026_03_11,10,8,2,10,8,2,10,8,2,3,2,1",
  "2026_03_12,12,7,5,12,7,5,22,15,7,1,1,0",
  "2026_03_13,9,4,5,9,4,5,31,19,12,2,1,1",
].join("\n");

const authorsByDayCsv = [
  "author,author_alias,attribution_link,asset_count,map_count,mod_count,total_downloads,2026_03_11,2026_03_12,2026_03_13",
  "author-a,Author A,/registry/authors/author-a,3,2,1,30,0,4,6",
  "author-b,Author B,/registry/authors/author-b,1,0,1,5,0,0,5",
].join("\n");

const mapStatisticsCsv = [
  "rank,id,name,author,author_alias,attribution_link,city_code,country,population,population_count,points_count,playable_area_cells",
  "1,map-a,Map Alpha,author-a,Author A,/registry/authors/author-a,TYO,JP,1000000,2000,300,0",
].join("\n");

describe("loadRegistryAnalyticsData", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          text: () => {
            if (url.includes("authors_by_day")) return Promise.resolve(authorsByDayCsv);
            if (url.includes("maps_statistics")) return Promise.resolve(mapStatisticsCsv);
            return Promise.resolve(analyticsCsv);
          },
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
    expect(data.authors.history).toEqual([
      { date: "2026-03-11", authors: 0 },
      { date: "2026-03-12", authors: 1 },
      { date: "2026-03-13", authors: 2 },
    ]);
    expect(data.authors.rankings[0]).toMatchObject({
      id: "author-a",
      name: "Author A",
      downloads: 30,
      maps: 2,
      mods: 1,
      assets: 3,
    });
    expect(data.projects.rankings[0]).toMatchObject({
      id: "author-a/project-a",
      name: "Project A",
      downloads: 30,
      maps: 2,
      mods: 1,
      assets: 3,
    });
    expect(data.mapStatistics.rankings[0]).toMatchObject({
      id: "map-a",
      name: "Map Alpha",
      authorId: "author-a",
      authorName: "Author A",
      countryCode: "JP",
      cityCode: "TYO",
      demand: 1_000_000,
      pops: 2_000,
      demandPoints: 300,
      playableAreaKm2: 42,
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
