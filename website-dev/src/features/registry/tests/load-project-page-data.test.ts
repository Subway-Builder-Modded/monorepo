import { afterEach, describe, expect, it, vi } from "vitest";
import { loadProjectPageData } from "@/features/registry/authors/lib/load-project-page-data";

type MockResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function mockFetchWithMap(map: Record<string, string>, missingStatus = 404) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL): Promise<MockResponse> => {
      const url = String(input);
      if (!(url in map)) {
        return {
          ok: false,
          status: missingStatus,
          text: async () => "",
        };
      }

      return {
        ok: true,
        status: 200,
        text: async () => map[url],
      };
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadProjectPageData", () => {
  it("loads project assets and computes analytics ranks among projects", async () => {
    mockFetchWithMap({
      "/registry-cache/authors/index.json": JSON.stringify({
        authors: [
          { github_id: 19807509, author_id: "ahkimn", author_alias: "Yukina-" },
          { github_id: 42, author_id: "kimth9", author_alias: "Kim Alias" },
        ],
      }),
      "/registry-cache/maps/integrity.json": JSON.stringify({
        generated_at: "2026-06-01T00:00:00Z",
        listings: {
          "yukina-osaka": {
            versions: {
              "v0.1.0": { is_complete: true, checked_at: "2026-05-01T00:00:00Z" },
              "v0.2.0": { is_complete: true, checked_at: "2026-06-15T00:00:00Z" },
            },
          },
          "yukina-kyoto": {
            versions: {
              "v0.1.0": { is_complete: true, checked_at: "2026-06-01T00:00:00Z" },
            },
          },
          seoul: {
            versions: {
              "v1.0.0": { is_complete: true, checked_at: "2026-04-01T00:00:00Z" },
            },
          },
        },
      }),
      "/registry-cache/maps/downloads.json": JSON.stringify({
        "yukina-osaka": { "v0.1.0": 50, "v0.2.0": 70 },
        "yukina-kyoto": { "v0.1.0": 40 },
        seoul: { "v1.0.0": 200 },
      }),
      "/registry-cache/maps/index.json": JSON.stringify({
        maps: ["yukina-osaka", "yukina-kyoto", "seoul"],
      }),
      "/registry-cache/maps/yukina-osaka/manifest.json": JSON.stringify({
        name: "Osaka",
        author: "ahkimn",
        description: "A detailed Osaka map.",
        source: "https://ahkimn.github.io/subwaybuilder-jp-maps/",
        update: { type: "github", repo: "ahkimn/subwaybuilder-jp-maps" },
        collaborators: [42],
      }),
      "/registry-cache/maps/yukina-kyoto/manifest.json": JSON.stringify({
        name: "Kyoto",
        author: "ahkimn",
        description: "A detailed Kyoto map.",
        source: "https://ahkimn.github.io/subwaybuilder-jp-maps/",
        update: { type: "github", repo: "ahkimn/subwaybuilder-jp-maps" },
      }),
      "/registry-cache/maps/seoul/manifest.json": JSON.stringify({
        name: "Seoul",
        author: "kimth9",
        description: "A Seoul map.",
        source: "https://github.com/kimth9/sb_korean_map_pack",
      }),
      "/registry-cache/mods/integrity.json": JSON.stringify({ listings: {} }),
      "/registry-cache/mods/downloads.json": JSON.stringify({}),
      "/registry-cache/mods/index.json": JSON.stringify({ mods: [] }),
      "/registry-cache/analytics/most_popular_by_day.csv": [
        "listing_type,id,2026_06_18,2026_06_19,2026_06_20",
        "map,yukina-osaka,0,3,7",
        "map,yukina-kyoto,0,1,2",
        "map,seoul,1,20,30",
      ].join("\n"),
      "/registry-cache/github-releases-cache.json": JSON.stringify({
        repos: {
          "ahkimn/subwaybuilder-jp-maps": [
            { tag_name: "v0.1.0", published_at: "2026-05-01T00:00:00Z" },
            { tag_name: "v0.2.0", published_at: "2026-06-20T00:00:00Z" },
          ],
        },
      }),
    });

    const data = await loadProjectPageData("ahkimn", "subwaybuilder-jp-maps");

    expect(data?.project).toEqual({
      projectId: "ahkimn/subwaybuilder-jp-maps",
      projectName: "subwaybuilder-jp-maps",
      authorId: "ahkimn",
      authorLabel: "Yukina-",
      githubUrl: "https://github.com/ahkimn/subwaybuilder-jp-maps",
    });
    expect(data?.itemsByType.maps.map((item) => item.id)).toEqual(["yukina-osaka", "yukina-kyoto"]);
    expect(data?.contributorsByItemKey["maps:yukina-osaka"]).toEqual([
      { authorId: "kimth9", authorLabel: "Kim Alias" },
    ]);
    expect(data?.overview.mostRecentUpdate).toMatchObject({
      name: "Osaka",
      latestVersion: "v0.2.0",
      latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
    });
    expect(data?.analytics.downloads).toEqual({ total: 160, maps: 160, mods: 0 });
    expect(data?.analytics.ranks).toEqual({ total: 1, maps: 1, mods: null });
    expect(data?.analytics.history).toEqual([
      { date: "2026-06-19", total: 4, maps: 4, mods: 0 },
      { date: "2026-06-20", total: 9, maps: 9, mods: 0 },
    ]);
    expect(data?.analytics.trends.find((trend) => trend.period === "1d")).toMatchObject({
      downloads: 9,
      rank: 1,
    });
  });

  it("returns null for a repo with only one published asset", async () => {
    mockFetchWithMap({
      "/registry-cache/authors/index.json": JSON.stringify({
        authors: [{ github_id: 1, author_id: "solo", author_alias: "Solo" }],
      }),
      "/registry-cache/maps/integrity.json": JSON.stringify({
        listings: {
          "solo-map": {
            versions: {
              "v1.0.0": { is_complete: true, checked_at: "2026-06-01T00:00:00Z" },
            },
          },
        },
      }),
      "/registry-cache/maps/downloads.json": JSON.stringify({
        "solo-map": { "v1.0.0": 12 },
      }),
      "/registry-cache/maps/index.json": JSON.stringify({ maps: ["solo-map"] }),
      "/registry-cache/maps/solo-map/manifest.json": JSON.stringify({
        name: "Solo Map",
        author: "solo",
        description: "A single published asset.",
        source: "https://github.com/solo/one",
      }),
      "/registry-cache/mods/integrity.json": JSON.stringify({ listings: {} }),
      "/registry-cache/mods/downloads.json": JSON.stringify({}),
      "/registry-cache/mods/index.json": JSON.stringify({ mods: [] }),
    });

    await expect(loadProjectPageData("solo", "one")).resolves.toBeNull();
  });

  it("returns null for a project without registry assets", async () => {
    mockFetchWithMap({
      "/registry-cache/authors/index.json": JSON.stringify({ authors: [] }),
      "/registry-cache/maps/integrity.json": JSON.stringify({ listings: {} }),
      "/registry-cache/maps/downloads.json": JSON.stringify({}),
      "/registry-cache/maps/index.json": JSON.stringify({ maps: [] }),
      "/registry-cache/mods/integrity.json": JSON.stringify({ listings: {} }),
      "/registry-cache/mods/downloads.json": JSON.stringify({}),
      "/registry-cache/mods/index.json": JSON.stringify({ mods: [] }),
    });

    await expect(loadProjectPageData("missing", "project")).resolves.toBeNull();
  });
});
