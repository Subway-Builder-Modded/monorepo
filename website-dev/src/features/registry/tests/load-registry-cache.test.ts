import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";

vi.mock("country-flag-emoji", () => ({
  default: {
    get: (code: string) => {
      if (code === "KR") return { name: "South Korea", emoji: "🇰🇷" };
      if (code === "JP") return { name: "Japan", emoji: "🇯🇵" };
      return undefined;
    },
  },
}));

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

describe("loadRegistryItemsForType", () => {
  it("loads maps from cached files, excludes test items, and normalizes fields", async () => {
    const base = "/registry/maps";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        generated_at: "2025-01-01T00:00:00.000Z",
        listings: {
          "gwangju-4": {
            versions: {
              v1: { is_complete: true, checked_at: "2025-01-10T00:00:00.000Z" },
              v2: { is_complete: true, checked_at: "2025-01-12T00:00:00.000Z" },
            },
          },
          "test-map": {
            versions: {
              v1: { is_complete: true, checked_at: "2025-01-09T00:00:00.000Z" },
            },
          },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({
        "gwangju-4": { v1: 10, v2: 5 },
        "test-map": { v1: 999 },
      }),
      "/registry/authors/index.json": JSON.stringify({
        authors: [{ author_id: "kimth9", author_alias: "Kim Alias" }],
      }),
      [`${base}/index.json`]: JSON.stringify({ maps: ["gwangju-4", "test-map"] }),
      [`${base}/gwangju-4/manifest.json`]: JSON.stringify({
        name: "  Gwangju 4  ",
        author: "  kimth9  ",
        description: "  Test map  ",
        tags: ["east-asia", "korea"],
        gallery: ["thumb.webp"],
        city_code: "KWJ4",
        country: "kr",
        residents_total: 2140345,
      }),
      [`${base}/test-map/manifest.json`]: JSON.stringify({
        name: "test-map",
        is_test: true,
      }),
    });

    const items = await loadRegistryItemsForType("maps", "maps");

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "gwangju-4",
      type: "maps",
      routeSegment: "maps",
      href: "/registry/maps/gwangju-4",
      name: "Gwangju 4",
      author: "Kim Alias",
      description: "Test map",
      tags: ["east-asia", "korea"],
      thumbnailSrc: "/registry/maps/gwangju-4/thumb.webp",
      totalDownloads: 15,
      cityCode: "KWJ4",
      countryCode: "KR",
      countryName: "South Korea",
      countryEmoji: "🇰🇷",
      population: 2140345,
      isTest: false,
    });

    expect(items[0]?.lastActivityAt).toBe(Date.parse("2025-01-12T00:00:00.000Z"));
  });

  it("falls back to integrity ids when index list is empty and handles defaults", async () => {
    const base = "/registry/mods";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        generated_at: "2025-02-01T00:00:00.000Z",
        listings: {
          "simple-trains": { has_complete_version: true, versions: {} },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({
        "simple-trains": { v1: 1 },
      }),
      [`${base}/index.json`]: JSON.stringify({ mods: [] }),
      [`${base}/simple-trains/manifest.json`]: JSON.stringify({
        // name missing should fallback to id
        // author missing should fallback to Unknown creator
        gallery: ["https://cdn.example.com/preview.png"],
      }),
    });

    const items = await loadRegistryItemsForType("mods", "mods");

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "simple-trains",
      name: "simple-trains",
      author: "Unknown creator",
      description: "",
      tags: [],
      thumbnailSrc: "https://cdn.example.com/preview.png",
      totalDownloads: 1,
      cityCode: null,
      countryCode: null,
      countryName: null,
      countryEmoji: null,
      population: null,
    });

    expect(items[0]?.lastActivityAt).toBe(Date.parse("2025-02-01T00:00:00.000Z"));
  });

  it("returns zero downloads and null thumbnail when optional data is missing", async () => {
    const base = "/registry/maps";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        listings: { alpha: { has_complete_version: true, versions: {} } },
      }),
      [`${base}/downloads.json`]: JSON.stringify({}),
      [`${base}/index.json`]: JSON.stringify({ maps: ["alpha"] }),
      [`${base}/alpha/manifest.json`]: JSON.stringify({
        name: "Alpha",
        author: "A",
        description: "D",
      }),
    });

    const items = await loadRegistryItemsForType("maps", "maps");

    expect(items).toHaveLength(1);
    expect(items[0]?.totalDownloads).toBe(0);
    expect(items[0]?.thumbnailSrc).toBeNull();
  });

  it("excludes items that fail integrity completeness", async () => {
    const base = "/registry/mods";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        generated_at: "2025-02-01T00:00:00.000Z",
        listings: {
          "good-mod": {
            versions: {
              v1: { is_complete: true, checked_at: "2025-02-02T00:00:00.000Z" },
            },
          },
          "broken-mod": {
            versions: {
              v1: { is_complete: false, checked_at: "2025-02-03T00:00:00.000Z" },
            },
          },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({
        "good-mod": { v1: 2 },
        "broken-mod": { v1: 99 },
      }),
      [`${base}/index.json`]: JSON.stringify({ mods: ["good-mod", "broken-mod"] }),
      [`${base}/good-mod/manifest.json`]: JSON.stringify({
        name: "Good Mod",
      }),
      [`${base}/broken-mod/manifest.json`]: JSON.stringify({
        name: "Broken Mod",
      }),
    });

    const items = await loadRegistryItemsForType("mods", "mods");

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("good-mod");
  });
});
