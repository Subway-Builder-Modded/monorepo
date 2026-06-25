import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadRegistryDetail } from "@/features/registry/detail/lib/load-registry-detail";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

vi.mock("@/features/registry/lib/load-registry-cache", () => ({
  loadRegistryItemsForType: vi.fn(),
}));

type MockResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function makeItem(id: string, manifest: unknown): RegistrySearchItem {
  return {
    id,
    type: "maps",
    routeSegment: "maps",
    href: `/registry/maps/${id}`,
    name: id,
    author: "Map maker",
    authorId: "map-maker",
    description: "",
    tags: [],
    thumbnailSrc: null,
    totalDownloads: 0,
    lastActivityAt: 0,
    cityCode: null,
    countryCode: null,
    countryName: null,
    countryEmoji: null,
    population: null,
    isTest: false,
    manifest,
  };
}

function mockRegistryItems(item: RegistrySearchItem) {
  vi.mocked(loadRegistryItemsForType).mockImplementation(async (typeId) =>
    typeId === item.type ? [item] : [],
  );
}

function mockFetchWithMap(map: Record<string, string>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL): Promise<MockResponse> => {
      const url = String(input);
      if (!(url in map)) {
        return {
          ok: false,
          status: 404,
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

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(loadRegistryItemsForType).mockReset();
});

describe("loadRegistryDetail", () => {
  it("uses GitHub release publish dates for version dates", async () => {
    const id = "akron-oh";
    const manifest = {
      name: "Akron",
      update: { type: "github", repo: "bean1322/akron-oh-map" },
    };

    mockRegistryItems(makeItem(id, manifest));
    mockFetchWithMap({
      [`/registry-cache/maps/${id}/manifest.json`]: JSON.stringify(manifest),
      "/registry-cache/maps/integrity.json": JSON.stringify({
        listings: {
          [id]: {
            versions: {
              "1.0.0": {
                is_complete: true,
                checked_at: "2026-06-21T07:16:20.303Z",
                source: { tag: "v1.0.0" },
              },
              "0.9.0": {
                is_complete: true,
                checked_at: "2026-06-21T07:16:20.303Z",
                source: { tag: "v0.9.0" },
              },
            },
          },
        },
      }),
      "/registry-cache/maps/downloads.json": JSON.stringify({}),
      "/registry-cache/authors/index.json": JSON.stringify({ authors: [] }),
      "/registry-cache/analytics/most_popular_by_day.csv": "id,total\n",
      "/registry-cache/github-releases-cache.json": JSON.stringify({
        repos: {
          "bean1322/akron-oh-map": [
            { tag_name: "v1.0.0", published_at: "2026-04-09T12:28:52Z" },
            { tag_name: "v0.9.0", published_at: "2026-03-20T10:00:00Z" },
          ],
        },
      }),
    });

    const detail = await loadRegistryDetail("maps", id);

    expect(detail?.versionReleaseDates).toEqual({
      "1.0.0": "2026-04-09T12:28:52Z",
      "0.9.0": "2026-03-20T10:00:00Z",
    });
  });

  it("uses custom version dates for custom update sources", async () => {
    const id = "amsterdam";
    const updateUrl = "https://ryandicicco.github.io/Subway-Builder-Maps/AMS.json";
    const manifest = {
      name: "Amsterdam",
      update: { type: "custom", url: updateUrl },
    };

    mockRegistryItems(makeItem(id, manifest));
    mockFetchWithMap({
      [`/registry-cache/maps/${id}/manifest.json`]: JSON.stringify(manifest),
      "/registry-cache/maps/integrity.json": JSON.stringify({
        listings: {
          [id]: {
            versions: {
              "1.2.0": {
                is_complete: true,
                checked_at: "2026-06-21T07:16:20.303Z",
              },
              "1.0.0": {
                is_complete: true,
                checked_at: "2026-06-21T07:16:20.303Z",
              },
            },
          },
        },
      }),
      "/registry-cache/maps/downloads.json": JSON.stringify({}),
      "/registry-cache/authors/index.json": JSON.stringify({ authors: [] }),
      "/registry-cache/analytics/most_popular_by_day.csv": "id,total\n",
      "/registry-cache/github-releases-cache.json": JSON.stringify({
        custom_urls: {
          [updateUrl]: [
            { version: "1.2.0", date: "2026-03-16" },
            { version: "1.0.0", date: "2026-03-08" },
          ],
        },
      }),
    });

    const detail = await loadRegistryDetail("maps", id);

    expect(detail?.versionReleaseDates).toEqual({
      "1.2.0": "2026-03-16",
      "1.0.0": "2026-03-08",
    });
  });
});
