import { afterEach, describe, expect, it, vi } from "vitest";
import { loadAuthorPageData } from "@/features/registry/authors/lib/load-author-page-data";

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

describe("loadAuthorPageData", () => {
  it("builds author overview, analytics, contributors, and collaborations from cache files", async () => {
    mockFetchWithMap({
      "/registry-cache/authors/index.json": JSON.stringify({
        authors: [
          {
            github_id: 19807509,
            author_id: "ahkimn",
            author_alias: "Yukina-",
            attribution_method: "custom",
            attribution_link: "https://subwaybuildermodded.com/credits",
            contributor_tier: "developer",
          },
          {
            github_id: "42",
            author_id: "kimth9",
            author_alias: "Kim Alias",
          },
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
        },
      }),
      "/registry-cache/maps/downloads.json": JSON.stringify({
        "yukina-osaka": { "v0.1.0": 50, "v0.2.0": 70 },
        "yukina-kyoto": { "v0.1.0": 20 },
      }),
      "/registry-cache/maps/index.json": JSON.stringify({ maps: ["yukina-osaka", "yukina-kyoto"] }),
      "/registry-cache/maps/yukina-osaka/manifest.json": JSON.stringify({
        name: "Osaka",
        author: "ahkimn",
        description: "A detailed Osaka map.",
        source: "https://ahkimn.github.io/subwaybuilder-jp-maps/",
        update: { type: "github", repo: "Yukina/Osaka" },
        collaborators: [42, 19807509],
      }),
      "/registry-cache/maps/yukina-kyoto/manifest.json": JSON.stringify({
        name: "Kyoto",
        author: "ahkimn",
        description: "A detailed Kyoto map.",
        source: "https://ahkimn.github.io/subwaybuilder-jp-maps/",
      }),
      "/registry-cache/mods/integrity.json": JSON.stringify({
        generated_at: "2026-06-01T00:00:00Z",
        listings: {
          "signal-pack": {
            versions: {
              "1.0.0": { is_complete: true, checked_at: "2026-04-01T00:00:00Z" },
            },
          },
          "japanese-trains": {
            versions: {
              "2.0.0": { is_complete: true, checked_at: "2026-03-01T00:00:00Z" },
            },
          },
        },
      }),
      "/registry-cache/mods/downloads.json": JSON.stringify({
        "signal-pack": { "1.0.0": 30 },
        "japanese-trains": { "2.0.0": 200 },
      }),
      "/registry-cache/mods/index.json": JSON.stringify({
        mods: ["signal-pack", "japanese-trains"],
      }),
      "/registry-cache/mods/signal-pack/manifest.json": JSON.stringify({
        name: "Signal Pack",
        author: "ahkimn",
        description: "Signals.",
        update: { type: "custom", url: "https://example.com/signal-pack.json" },
      }),
      "/registry-cache/mods/japanese-trains/manifest.json": JSON.stringify({
        name: "Japanese Trains",
        author: "kimth9",
        description: "Trains.",
        collaborators: ["19807509"],
      }),
      "/registry-cache/analytics/most_popular_by_day.csv": [
        "listing_type,id,2026_06_18,2026_06_19,2026_06_20",
        "map,yukina-osaka,0,3,7",
        "mod,signal-pack,1,2,1",
        "mod,japanese-trains,4,5,6",
      ].join("\n"),
      "/registry-cache/github-releases-cache.json": JSON.stringify({
        repos: {
          "yukina/osaka": [
            { tag_name: "v0.1.0", published_at: "2026-05-01T00:00:00Z" },
            { tag_name: "v0.2.0", published_at: "2026-06-20T00:00:00Z" },
          ],
        },
        custom_urls: {
          "https://example.com/signal-pack.json": [
            { version: "1.0.0", date: "2026-04-10T00:00:00Z" },
          ],
        },
      }),
    });

    const data = await loadAuthorPageData("AHKIMN");

    expect(data?.author).toMatchObject({
      githubId: 19807509,
      authorId: "ahkimn",
      authorAlias: "Yukina-",
      attributionLink: "https://subwaybuildermodded.com/credits",
    });
    expect(data?.itemsByType.maps.map((item) => item.id)).toEqual(["yukina-osaka", "yukina-kyoto"]);
    expect(data?.itemsByType.mods.map((item) => item.id)).toEqual(["signal-pack"]);
    expect(data?.collaborations.map((item) => item.id)).toEqual(["japanese-trains"]);
    expect(data?.projects).toEqual([
      {
        projectId: "ahkimn/subwaybuilder-jp-maps",
        projectName: "subwaybuilder-jp-maps",
        href: "/registry/authors/ahkimn/subwaybuilder-jp-maps",
        maps: 2,
        mods: 0,
        totalDownloads: 140,
        rank: 1,
      },
    ]);
    expect(data?.contributorsByItemKey["maps:yukina-osaka"]).toEqual([
      { authorId: "kimth9", authorLabel: "Kim Alias" },
    ]);
    expect(data?.overview.newestAsset?.name).toBe("Osaka");
    expect(data?.overview.mostRecentUpdate).toMatchObject({
      name: "Osaka",
      latestVersion: "v0.2.0",
      latestVersionUpdatedAt: Date.parse("2026-06-20T00:00:00Z"),
    });
    expect(data?.analytics.downloads).toEqual({ total: 170, maps: 140, mods: 30 });
    expect(data?.analytics.history).toEqual([
      { date: "2026-06-18", total: 1, maps: 0, mods: 1 },
      { date: "2026-06-19", total: 5, maps: 3, mods: 2 },
      { date: "2026-06-20", total: 8, maps: 7, mods: 1 },
    ]);
    expect(data?.analytics.trends.find((trend) => trend.period === "1d")).toMatchObject({
      downloads: 8,
      rank: 1,
    });
    expect(data?.analytics.rankingsByType.maps).toEqual([
      {
        id: "yukina-osaka",
        name: "Osaka",
        href: "/registry/maps/yukina-osaka",
        downloads: 120,
        rank: 1,
      },
      {
        id: "yukina-kyoto",
        name: "Kyoto",
        href: "/registry/maps/yukina-kyoto",
        downloads: 20,
        rank: 2,
      },
    ]);
  });

  it("returns null when the author has no profile, assets, or collaborations", async () => {
    mockFetchWithMap({
      "/registry-cache/authors/index.json": JSON.stringify({ authors: [] }),
      "/registry-cache/maps/integrity.json": JSON.stringify({ listings: {} }),
      "/registry-cache/maps/downloads.json": JSON.stringify({}),
      "/registry-cache/maps/index.json": JSON.stringify({ maps: [] }),
      "/registry-cache/mods/integrity.json": JSON.stringify({ listings: {} }),
      "/registry-cache/mods/downloads.json": JSON.stringify({}),
      "/registry-cache/mods/index.json": JSON.stringify({ mods: [] }),
    });

    await expect(loadAuthorPageData("missing-author")).resolves.toBeNull();
  });
});
