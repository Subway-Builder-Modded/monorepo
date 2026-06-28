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
              authorId: "author-a",
              publishedAt: Date.UTC(2026, 2, 11),
              totalDownloads: 10,
              manifest: {
                grid_statistics: {
                  detail: {
                    playableAreaKm2: 42,
                  },
                },
              },
            },
            {
              id: "map-b",
              type: "maps",
              authorId: "author-a",
              publishedAt: Date.UTC(2026, 2, 12),
              totalDownloads: 20,
              manifest: {},
            },
          ]
        : [
            {
              id: "mod-a",
              type: "mods",
              authorId: "author-b",
              publishedAt: Date.UTC(2026, 2, 13),
              totalDownloads: 5,
              manifest: {},
            },
          ],
    ),
}));

const byDayCsv = [
  "listing_type,id,name,author,author_alias,attribution_link,total_downloads,2026_03_11,2026_03_12,2026_03_13",
  "map,map-a,Map Alpha,author-a,Author A,/registry/authors/author-a,10,4,3,3",
  "map,map-b,Map Beta,author-a,Author A,/registry/authors/author-a,20,0,8,12",
  "mod,mod-a,Mod Alpha,author-b,Author B,/registry/authors/author-b,5,0,0,5",
  "map,map-test,Test Map,author-a,Author A,/registry/authors/author-a,999,999,999,999",
].join("\n");

const allTimeRankingCsv = [
  "rank,listing_type,id,name,author,author_alias,attribution_link,total_downloads,adjusted_total_downloads",
  "1,map,map-test,Test Map,author-a,Author A,/registry/authors/author-a,999,999",
  "2,map,map-b,Map Beta,author-a,Author A,/registry/authors/author-a,20,20",
  "3,map,map-a,Map Alpha,author-a,Author A,/registry/authors/author-a,10,10",
  "4,mod,mod-a,Mod Alpha,author-b,Author B,/registry/authors/author-b,5,5",
].join("\n");

const changeRankingCsv = [
  "rank,listing_type,id,name,author,author_alias,attribution_link,download_change,adjusted_download_change",
  "1,map,map-test,Test Map,author-a,Author A,/registry/authors/author-a,999,999",
  "2,map,map-b,Map Beta,author-a,Author A,/registry/authors/author-a,20,20",
  "3,map,map-a,Map Alpha,author-a,Author A,/registry/authors/author-a,10,10",
  "4,mod,mod-a,Mod Alpha,author-b,Author B,/registry/authors/author-b,5,5",
].join("\n");

const authorsByDayCsv = [
  "author,author_alias,attribution_link,asset_count,map_count,mod_count,total_downloads,2026_03_11,2026_03_12,2026_03_13",
  "author-a,Author A,/registry/authors/author-a,3,2,1,30,0,4,6",
  "author-b,Author B,/registry/authors/author-b,1,0,1,5,0,0,5",
].join("\n");

const mapStatisticsCsv = [
  "rank,id,name,author,author_alias,attribution_link,city_code,country,population,population_count,points_count,playable_area_cells",
  "1,map-a,Map Alpha,author-a,Author A,/registry/authors/author-a,TYO,JP,1000000,2000,300,0",
  "2,map-test,Test Map,author-a,Author A,/registry/authors/author-a,TST,JP,9999999,9999,999,0",
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
            if (url.includes("most_popular_by_day")) return Promise.resolve(byDayCsv);
            if (url.includes("most_popular_all_time")) return Promise.resolve(allTimeRankingCsv);
            return Promise.resolve(changeRankingCsv);
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
      downloads: { total: 4, maps: 4, mods: 0 },
      cumulativeDownloads: { total: 4, maps: 4, mods: 0 },
      listings: { total: 1, maps: 1, mods: 0 },
    });
    expect(data.authors.history).toEqual([
      { date: "2026-03-11", authors: 1 },
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
    expect(data.contentRankings["all-time"].maps.map((row) => row.id)).toEqual(["map-b", "map-a"]);
    expect(data.mapStatistics.rankings.map((row) => row.id)).toEqual(["map-a"]);
  });

  it("filters and sums analytics history by selected period", async () => {
    const data = await loadRegistryAnalyticsData();
    const history = filterRegistryAnalyticsHistory(data.history, "3d");
    const totals = sumRegistryAnalyticsHistory(history);

    expect(history.map((row) => row.date)).toEqual(["2026-03-11", "2026-03-12", "2026-03-13"]);
    expect(totals.downloads).toEqual({ total: 35, maps: 30, mods: 5 });
    expect(totals.listings).toEqual({ total: 3, maps: 2, mods: 1 });
  });
});
