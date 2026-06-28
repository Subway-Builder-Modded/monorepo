import { afterEach, describe, expect, it, vi } from "vitest";
import { loadCreatorDatabaseData } from "@/features/registry/authors/lib/load-creator-database";

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

describe("loadCreatorDatabaseData", () => {
  it("aggregates authors and only includes multi-asset projects", async () => {
    mockFetchWithMap({
      "/registry-cache/authors/index.json": JSON.stringify({
        authors: [
          { github_id: 19807509, author_id: "ahkimn", author_alias: "Yukina-" },
          { github_id: "42", author_id: "kimth9", author_alias: "Kim Alias" },
          { github_id: "99", author_id: "no-assets", author_alias: "No Assets" },
        ],
      }),
      "/registry-cache/maps/integrity.json": JSON.stringify({
        listings: {
          osaka: {
            versions: {
              "v1.0.0": { is_complete: true, checked_at: "2026-06-01T00:00:00Z" },
            },
          },
          kyoto: {
            versions: {
              "v1.0.0": { is_complete: true, checked_at: "2026-06-02T00:00:00Z" },
            },
          },
          seoul: {
            versions: {
              "v1.0.0": { is_complete: true, checked_at: "2026-06-03T00:00:00Z" },
            },
          },
        },
      }),
      "/registry-cache/maps/downloads.json": JSON.stringify({
        osaka: { "v1.0.0": 100 },
        kyoto: { "v1.0.0": 50 },
        seoul: { "v1.0.0": 200 },
      }),
      "/registry-cache/maps/index.json": JSON.stringify({ maps: ["osaka", "kyoto", "seoul"] }),
      "/registry-cache/maps/osaka/manifest.json": JSON.stringify({
        name: "Osaka",
        author: "ahkimn",
        description: "Osaka map.",
        source: "https://github.com/ahkimn/subwaybuilder-jp-maps",
        collaborators: [42],
      }),
      "/registry-cache/maps/kyoto/manifest.json": JSON.stringify({
        name: "Kyoto",
        author: "ahkimn",
        description: "Kyoto map.",
        source: "https://github.com/ahkimn/subwaybuilder-jp-maps",
      }),
      "/registry-cache/maps/seoul/manifest.json": JSON.stringify({
        name: "Seoul",
        author: "kimth9",
        description: "Seoul map.",
        source: "https://github.com/kimth9/single-map",
      }),
      "/registry-cache/mods/integrity.json": JSON.stringify({ listings: {} }),
      "/registry-cache/mods/downloads.json": JSON.stringify({}),
      "/registry-cache/mods/index.json": JSON.stringify({ mods: [] }),
    });

    const data = await loadCreatorDatabaseData();

    expect(data.authors).toEqual([
      expect.objectContaining({
        id: "kimth9",
        label: "Kim Alias",
        maps: 1,
        mods: 0,
        collaborations: 1,
        assets: 1,
        downloads: 200,
      }),
      expect.objectContaining({
        id: "ahkimn",
        label: "Yukina-",
        maps: 2,
        mods: 0,
        collaborations: 0,
        assets: 2,
        downloads: 150,
      }),
    ]);
    expect(data.authors).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "no-assets" })]),
    );
    expect(data.projects).toEqual([
      expect.objectContaining({
        id: "ahkimn/subwaybuilder-jp-maps",
        name: "subwaybuilder-jp-maps",
        authorId: "ahkimn",
        authorLabel: "Yukina-",
        maps: 2,
        mods: 0,
        assets: 2,
        downloads: 150,
      }),
    ]);
  });
});
