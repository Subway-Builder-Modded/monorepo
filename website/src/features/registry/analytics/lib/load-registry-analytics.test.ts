import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bucketRegistryAnalyticsHourly,
  buildCustomAuthorRankings,
  buildCustomContentRankings,
  buildCustomProjectRankings,
  createHourlyBucketAligner,
  filterRegistryAnalyticsHistory,
  getCustomRangeDates,
  getHourlyChartTicks,
  getHourlyRangeBuckets,
  getHourlyShardUrls,
  getHourlyWindowBuckets,
  isHourlyCustomRange,
  loadRegistryAnalyticsData,
  selectPresetDates,
  sumRegistryAnalyticsHistory,
  validateCustomRange,
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
          caretakenAssets: 0,
          mapDownloads: 25,
          modDownloads: 5,
          mapCollaborations: 0,
          modCollaborations: 0,
          caretakenMaps: 0,
          caretakenMods: 0,
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
          caretakenAssets: 0,
          mapDownloads: 0,
          modDownloads: 5,
          mapCollaborations: 0,
          modCollaborations: 0,
          caretakenMaps: 0,
          caretakenMods: 0,
        },
      ],
      projects: [
        {
          id: "author-a/project-a",
          name: "Project A",
          href: "/registry/authors/author-a/project-a",
          authorId: "author-a",
          authorLabel: "Author A",
          authorHref: "/registry/authors/author-a",
          downloads: 30,
          maps: 2,
          mods: 1,
          assets: 3,
          mapDownloads: 25,
          modDownloads: 5,
          searchTerms: ["Map Alpha", "Tokyo"],
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
              name: "Map Alpha",
              author: "Author A",
              authorId: "author-a",
              searchAliases: ["Tokyo", "Toukyou"],
              cityCode: "TYO",
              countryCode: "JP",
              projectId: "author-a/project-a",
              publishedAt: Date.UTC(2026, 2, 11),
              totalDownloads: 10,
              manifest: {
                location: "east-asia",
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
              name: "Map Beta",
              author: "Author A",
              authorId: "author-a",
              searchAliases: ["Beta City"],
              cityCode: "OSA",
              countryCode: "JP",
              projectId: "author-a/project-a",
              publishedAt: Date.UTC(2026, 2, 12),
              totalDownloads: 20,
              // Deprecated on 03-12 and reinstated on 03-13.
              manifest: {
                deprecation_history: [
                  {
                    since: "2026-03-12T00:00:00.000Z",
                    by_github_id: 1,
                    until: "2026-03-13T00:00:00.000Z",
                    removed_by_github_id: 1,
                  },
                ],
              },
            },
          ]
        : [
            {
              id: "mod-a",
              type: "mods",
              name: "Mod Alpha",
              author: "Author B",
              authorId: "author-b",
              searchAliases: ["Alternate Mod"],
              publishedAt: Date.UTC(2026, 2, 13),
              totalDownloads: 5,
              manifest: { deprecation: { since: "2026-03-13T00:00:00.000Z", by_github_id: 1 } },
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
  "author-c,Author C,/registry/authors/author-c,1,1,0,2,0,2,0",
].join("\n");

const hourlyDownloadsCsv = [
  "bucket_utc,listing_type,id,downloads",
  "2026-03-12T04:00Z,map,map-a,2",
  "2026-03-12T05:00Z,map,map-b,1",
  "2026-03-12T05:00Z,mod,mod-a,3",
].join("\n");

const authorWindowCsv = [
  "rank,author,author_alias,attribution_link,asset_count,map_count,mod_count,download_change,adjusted_download_change,current_total,adjusted_current_total,baseline_total,adjusted_baseline_total,latest_snapshot,baseline_snapshot,map_download_change,adjusted_map_download_change,mod_download_change,adjusted_mod_download_change",
  "1,author-a,Author A,https://github.com/author-a,3,2,1,12,11,30,29,18,18,snap.json,snap.json,8,7,4,4",
  "2,subway-builder-modded-admin,Admin,https://github.com/admin,1,1,0,9,9,9,9,0,0,snap.json,snap.json,9,9,0,0",
  "3,author-b,Author B,https://github.com/author-b,1,0,1,3,3,5,5,2,2,snap.json,snap.json,0,0,3,3",
  "4,author-zero,Author Zero,https://github.com/author-zero,1,1,0,0,0,4,4,4,4,snap.json,snap.json,0,0,0,0",
].join("\n");

const projectWindowCsv = [
  "rank,project_key,project_name,author,author_alias,attribution_link,listing_count,download_change,adjusted_download_change,current_total,adjusted_current_total,baseline_total,adjusted_baseline_total,latest_snapshot,baseline_snapshot,map_download_change,adjusted_map_download_change,mod_download_change,adjusted_mod_download_change",
  "1,author-a/project-a,Project A,author-a,Author A,https://github.com/author-a,3,12,11,30,29,18,18,snap.json,snap.json,8,7,4,4",
  "2,maps:solo-map,Solo Map,author-b,Author B,https://github.com/author-b,1,6,6,6,6,0,0,snap.json,snap.json,6,6,0,0",
].join("\n");

const assetsByDayCsv = [
  "snapshot_date,total_downloads,maps,mods,total_new_assets_versions,new_maps_versions,new_mods_versions",
  "2026_03_11,4,4,0,2,2,0",
  "2026_03_12,11,11,0,1,1,0",
  "2026_03_13,20,15,5,2,1,1",
].join("\n");

const assetVersionsByDayCsv = [
  "listing_type,id,version,total_downloads,2026_03_11,2026_03_12,2026_03_13,first_seen",
  "map,map-a,1.0.0,10,4,3,3,2026_03_11",
  "map,map-b,1.0.0,8,0,8,0,2026_03_11",
  "map,map-b,1.1.0,12,0,0,12,2026_03_12",
  "mod,mod-a,1.0.0,5,0,0,5,2026_03_13",
].join("\n");

const versionCreditsCsv = [
  "listing_type,listing_id,version,credited_author_id",
  "map,map-b,1.1.0,author-b",
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
            if (url.includes("assets_by_day")) return Promise.resolve(assetsByDayCsv);
            if (url.includes("asset_versions_by_day")) {
              return Promise.resolve(assetVersionsByDayCsv);
            }
            if (url.includes("listing_version_credits")) {
              return Promise.resolve(versionCreditsCsv);
            }
            if (url.includes("authors_last_")) return Promise.resolve(authorWindowCsv);
            if (url.includes("projects_most_popular_last_")) {
              return Promise.resolve(projectWindowCsv);
            }
            if (url.includes("maps_statistics")) return Promise.resolve(mapStatisticsCsv);
            if (url.includes("most_popular_by_day")) return Promise.resolve(byDayCsv);
            // One shard carries the fixture; later months are empty shards.
            if (url.includes("/hourly/downloads-")) {
              return Promise.resolve(url.includes("downloads-2026-07") ? hourlyDownloadsCsv : "");
            }
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
    expect(data.hourly).toEqual([
      { bucket: "2026-03-12T04:00Z", downloads: { total: 2, maps: 2, mods: 0 } },
      { bucket: "2026-03-12T05:00Z", downloads: { total: 4, maps: 1, mods: 3 } },
    ]);
    // Per-entity hourly series carry the same listing→entity assignments as
    // their daily siblings, so the 1d/3d entity charts have data to draw.
    expect(data.listings.hourlyDownloads.entities.map((entity) => entity.id).sort()).toEqual([
      "map-a",
      "map-b",
      "mod-a",
    ]);
    expect(data.countries.hourlyDownloads.entities.map((entity) => entity.id)).toEqual(["JP"]);
    expect(data.countries.hourlyDownloads.entities[0].byBucket.get("2026-03-12T04:00Z")).toEqual({
      maps: 2,
      mods: 0,
    });
    expect(data.authors.hourlyDownloads.entities.map((entity) => entity.id).sort()).toEqual([
      "author-a",
      "author-b",
    ]);
    // Listings outside a multi-asset project (mod-a) are excluded outright, so
    // the project charts and their share denominator only hold real projects.
    expect(data.projects.hourlyDownloads.entities.map((entity) => entity.id)).toEqual([
      "author-a/project-a",
    ]);
    expect(data.projects.dailyDownloads.entities.map((entity) => entity.id)).toEqual([
      "author-a/project-a",
    ]);
    expect(data.regions.hourlyDownloads.entities.length).toBeGreaterThan(0);
    expect(data.history[0]).toMatchObject({
      date: "2026-03-11",
      downloads: { total: 4, maps: 4, mods: 0 },
      cumulativeDownloads: { total: 4, maps: 4, mods: 0 },
      listings: { total: 1, maps: 1, mods: 0 },
    });
    // Project A debuts with map-a on 03-11; mod-a has no project.
    expect(data.projects.history).toEqual([
      { date: "2026-03-11", projects: 1 },
      { date: "2026-03-12", projects: 1 },
      { date: "2026-03-13", projects: 1 },
    ]);
    expect(data.authors.history).toEqual([
      { date: "2026-03-11", authors: 1 },
      { date: "2026-03-12", authors: 2 },
      { date: "2026-03-13", authors: 3 },
    ]);
    expect(data.authors.rankings["all-time"][0]).toMatchObject({
      id: "author-a",
      name: "Author A",
      downloads: { total: 30, maps: 25, mods: 5 },
      authored: { total: 3, maps: 2, mods: 1 },
      collaborator: { total: 0, maps: 0, mods: 0 },
      caretaker: { total: 0, maps: 0, mods: 0 },
    });
    expect(data.projects.rankings["all-time"][0]).toMatchObject({
      id: "author-a/project-a",
      name: "Project A",
      authorId: "author-a",
      authorName: "Author A",
      authorHref: "/registry/authors/author-a",
      downloads: { total: 30, maps: 25, mods: 5 },
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
      searchAliases: ["Tokyo", "Toukyou"],
      demand: 1_000_000,
      pops: 2_000,
      demandPoints: 300,
      playableAreaKm2: 42,
    });
    expect(data.contentRankings["all-time"].maps[0]).toMatchObject({
      id: "map-b",
      countryCode: "JP",
      countryName: "",
      searchAliases: ["Beta City"],
    });
    expect(data.contentRankings["all-time"].maps.map((row) => row.id)).toEqual(["map-b", "map-a"]);
    expect(data.mapStatistics.rankings.map((row) => row.id)).toEqual(["map-a"]);
  });

  it("builds window author/project rankings from the adjusted per-window CSVs", async () => {
    const data = await loadRegistryAnalyticsData();

    // Adjusted change wins over raw; the admin pseudo-author and zero-change
    // rows are dropped; role counts join from the creator database.
    expect(data.authors.hasTypeSplitWindows).toBe(true);
    expect(data.authors.rankings["7d"].map((row) => row.id)).toEqual(["author-a", "author-b"]);
    expect(data.authors.rankings["7d"][0]).toMatchObject({
      id: "author-a",
      name: "Author A",
      href: "/registry/authors/author-a",
      downloads: { total: 11, maps: 7, mods: 4 },
      authored: { total: 3, maps: 2, mods: 1 },
    });

    // Project windows keep only creator-database (multi-asset) projects, so
    // single-listing pseudo-project keys drop out.
    expect(data.projects.hasTypeSplitWindows).toBe(true);
    expect(data.projects.rankings["30d"].map((row) => row.id)).toEqual(["author-a/project-a"]);
    expect(data.projects.rankings["30d"][0]).toMatchObject({
      downloads: { total: 11, maps: 7, mods: 4 },
      maps: 2,
      mods: 1,
      assets: 3,
    });
  });

  it("builds the version release history and credited author series", async () => {
    const data = await loadRegistryAnalyticsData();

    expect(data.versions.hasFirstSeen).toBe(true);
    expect(data.versions.history).toEqual([
      { date: "2026-03-11", newVersions: { total: 2, maps: 2, mods: 0 } },
      { date: "2026-03-12", newVersions: { total: 1, maps: 1, mods: 0 } },
      { date: "2026-03-13", newVersions: { total: 2, maps: 1, mods: 1 } },
    ]);

    // map-a/map-b 1.0.0 fall to the listing author; map-b 1.1.0 credits the
    // caretaker via listing_version_credits; mod-a falls to its author.
    const byId = new Map(
      data.versions.authorDailyReleases.entities.map((entity) => [entity.id, entity]),
    );
    expect([...byId.keys()].sort()).toEqual(["author-a", "author-b"]);
    expect(byId.get("author-a")?.byDate.get("2026-03-11")).toEqual({ maps: 2, mods: 0 });
    expect(byId.get("author-b")?.byDate.get("2026-03-12")).toEqual({ maps: 1, mods: 0 });
    expect(byId.get("author-b")?.byDate.get("2026-03-13")).toEqual({ maps: 0, mods: 1 });
  });

  it("charts one debut and only the listing's current retirement", async () => {
    const data = await loadRegistryAnalyticsData();

    // map-b's deprecation was reversed, so only its debut charts — the closed
    // window in deprecation_history leaves no dip behind.
    expect(data.history[1]).toMatchObject({
      date: "2026-03-12",
      listings: { total: 1, maps: 1, mods: 0 },
      deprecations: { total: 0, maps: 0, mods: 0 },
    });
    // mod-a is still deprecated: one arrival, one departure, same day.
    expect(data.history[2]).toMatchObject({
      date: "2026-03-13",
      listings: { total: 1, maps: 0, mods: 1 },
      deprecations: { total: 1, maps: 0, mods: 1 },
      deletions: { total: 0, maps: 0, mods: 0 },
    });
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

// Hours 00:00-09:00 UTC, so the newest hour (09:00) is not on a wall-clock
// 4h boundary — the case that used to leave the trailing bar 3 hours short.
const HOUR_BUCKETS = Array.from(
  { length: 10 },
  (_, hour) => `2026-08-13T${String(hour).padStart(2, "0")}:00Z`,
);

describe("hourly bucket alignment", () => {
  it("anchors windows at the newest hour so the newest window is complete", () => {
    const align = createHourlyBucketAligner(HOUR_BUCKETS);

    // The newest window covers 06:00-09:00 — four hours, none of them missing.
    expect(HOUR_BUCKETS.slice(6).map(align)).toEqual([
      "2026-08-13T06:00Z",
      "2026-08-13T06:00Z",
      "2026-08-13T06:00Z",
      "2026-08-13T06:00Z",
    ]);
    expect(align("2026-08-13T05:00Z")).toBe("2026-08-13T02:00Z");
    expect(align("2026-08-13T02:00Z")).toBe("2026-08-13T02:00Z");
    // Windows run backwards past midnight rather than snapping to it.
    expect(align("2026-08-13T01:00Z")).toBe("2026-08-12T22:00Z");
  });

  it("returns the trailing windows with the aligner that produced them", () => {
    const { buckets, align } = getHourlyWindowBuckets(HOUR_BUCKETS, "1d");

    expect(buckets).toEqual(["2026-08-12T22:00Z", "2026-08-13T02:00Z", "2026-08-13T06:00Z"]);
    expect(buckets).toContain(align("2026-08-13T09:00Z"));
  });

  it("sums site-wide hourly points into the anchored windows", () => {
    const hourly = HOUR_BUCKETS.map((bucket) => ({
      bucket,
      downloads: { total: 1, maps: 1, mods: 0 },
    }));

    expect(bucketRegistryAnalyticsHourly(hourly)).toEqual([
      { bucket: "2026-08-12T22:00Z", downloads: { total: 2, maps: 2, mods: 0 } },
      { bucket: "2026-08-13T02:00Z", downloads: { total: 4, maps: 4, mods: 0 } },
      { bucket: "2026-08-13T06:00Z", downloads: { total: 4, maps: 4, mods: 0 } },
    ]);
  });

  it("spaces 3d ticks every third window, counting back from the newest", () => {
    const labels = Array.from({ length: 18 }, (_, index) => `label-${index}`);

    expect(getHourlyChartTicks(labels, "1d")).toEqual(labels);
    expect(getHourlyChartTicks(labels, "3d")).toEqual([
      "label-2",
      "label-5",
      "label-8",
      "label-11",
      "label-14",
      "label-17",
    ]);
  });
});

// 12:00 UTC on 2026-09-08 — "today" for every clock-dependent assertion.
const NOW_MS = Date.parse("2026-09-08T12:00:00Z");

describe("custom range rules", () => {
  it("validates the picker rules", () => {
    // Sub-week ranges: allowed from the hourly floor, may include today.
    expect(validateCustomRange({ from: "2026-09-03", to: "2026-09-08" }, NOW_MS)).toBeNull();
    expect(validateCustomRange({ from: "2026-07-01", to: "2026-07-04" }, NOW_MS)).toBeNull();
    expect(validateCustomRange({ from: "2026-06-30", to: "2026-07-03" }, NOW_MS)).toMatch(
      /hourly series/,
    );
    // Week-plus ranges: any start date, but only complete days (end < today).
    expect(validateCustomRange({ from: "2026-03-01", to: "2026-09-07" }, NOW_MS)).toBeNull();
    expect(validateCustomRange({ from: "2026-09-01", to: "2026-09-08" }, NOW_MS)).toMatch(
      /complete days/,
    );
    expect(validateCustomRangeExtras());
  });

  it("derives day counts, modes, and date lists", () => {
    expect(isHourlyCustomRange({ from: "2026-07-01", to: "2026-07-06" })).toBe(true);
    expect(isHourlyCustomRange({ from: "2026-07-01", to: "2026-07-07" })).toBe(false);
    expect(getCustomRangeDates({ from: "2026-07-30", to: "2026-08-02" })).toEqual([
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("restricts and anchors hourly windows to the range", () => {
    const buckets = Array.from({ length: 72 }, (_, hour) => {
      const day = String(1 + Math.floor(hour / 24)).padStart(2, "0");
      return `2026-07-${day}T${String(hour % 24).padStart(2, "0")}:00Z`;
    });
    const { buckets: windows, align } = getHourlyRangeBuckets(buckets, {
      from: "2026-07-02",
      to: "2026-07-03",
    });
    // Two full days of 4h windows, anchored at the newest in-range hour.
    expect(windows).toHaveLength(12);
    expect(windows[0]).toBe("2026-07-02T00:00Z");
    expect(windows[11]).toBe("2026-07-03T20:00Z");
    expect(align("2026-07-03T23:00Z")).toBe("2026-07-03T20:00Z");
    // Out-of-range days contribute no windows.
    expect(windows.some((window) => window.startsWith("2026-07-01"))).toBe(false);
  });

  it("excludes the partial current day from daily presets only", () => {
    const dates = ["2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08"];
    expect(selectPresetDates(dates, "7d", NOW_MS)).toEqual([
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
    ]);
    expect(selectPresetDates(dates, "3d", NOW_MS)).toEqual([
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
    ]);
    expect(selectPresetDates(dates, "all-time", NOW_MS)).toEqual(dates);

    const history = dates.map((date) => ({
      date,
      downloads: { total: 1, maps: 1, mods: 0 },
      cumulativeDownloads: { total: 1, maps: 1, mods: 0 },
      listings: { total: 0, maps: 0, mods: 0 },
      deprecations: { total: 0, maps: 0, mods: 0 },
      deletions: { total: 0, maps: 0, mods: 0 },
    }));
    expect(filterRegistryAnalyticsHistory(history, "7d", NOW_MS).map((row) => row.date)).toEqual([
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
    ]);
  });

  it("enumerates hourly shard urls from the floor month", () => {
    expect(getHourlyShardUrls(NOW_MS)).toEqual([
      "/registry-cache/analytics/hourly/downloads-2026-07.csv",
      "/registry-cache/analytics/hourly/downloads-2026-08.csv",
      "/registry-cache/analytics/hourly/downloads-2026-09.csv",
    ]);
  });
});

function validateCustomRangeExtras() {
  expect(validateCustomRange({ from: "2026-09-05", to: "2026-09-01" }, NOW_MS)).toMatch(
    /on or before/,
  );
  expect(validateCustomRange({ from: "", to: "2026-09-01" }, NOW_MS)).toMatch(/both dates/);
  expect(validateCustomRange({ from: "2026-09-01", to: "2026-09-09" }, NOW_MS)).toMatch(/future/);
  return true;
}

describe("custom range rankings", () => {
  it("sums content, author, and project rankings over the range", async () => {
    const data = await loadRegistryAnalyticsData();
    const range = { from: "2026-03-12", to: "2026-03-13" };

    // map-b: 8 + 12; map-a: 3 + 3; mod-a: 5 — metadata joins from all-time rows.
    const content = buildCustomContentRankings(data, range);
    expect(content.maps.map((row) => [row.id, row.downloads])).toEqual([
      ["map-b", 20],
      ["map-a", 6],
    ]);
    expect(content.mods.map((row) => [row.id, row.downloads])).toEqual([["mod-a", 5]]);

    const authors = buildCustomAuthorRankings(data, range);
    expect(authors[0]).toMatchObject({
      id: "author-a",
      downloads: { total: 26, maps: 26, mods: 0 },
      authored: { total: 3, maps: 2, mods: 1 },
    });

    const projects = buildCustomProjectRankings(data, range);
    expect(projects.map((row) => row.id)).toEqual(["author-a/project-a"]);
    expect(projects[0].downloads.total).toBeGreaterThan(0);
    expect(projects[0].maps).toBe(2);
  });
});
