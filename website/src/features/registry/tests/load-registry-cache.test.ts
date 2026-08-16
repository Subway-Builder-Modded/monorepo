import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";

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
  it("prefers manifest last_updated over integrity metadata", async () => {
    const base = "/registry-cache/mods";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        generated_at: "2025-02-01T00:00:00.000Z",
        listings: {
          "date-source-mod": {
            has_complete_version: true,
            last_updated: 1_710_000_000,
            versions: {
              v1: { is_complete: true, checked_at: "2026-06-21T07:16:20.303Z" },
            },
          },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({}),
      [`${base}/index.json`]: JSON.stringify({ mods: ["date-source-mod"] }),
      [`${base}/date-source-mod/manifest.json`]: JSON.stringify({
        name: "Date Source Mod",
        last_updated: 1_720_000_000,
      }),
    });

    const items = await loadRegistryItemsForType("mods", "mods");

    expect(items).toHaveLength(1);
    expect(items[0]?.lastActivityAt).toBe(1_720_000_000_000);
  });

  it("prefers manifest first_released for published date", async () => {
    const base = "/registry-cache/mods";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        listings: {
          "release-source-mod": {
            has_complete_version: true,
            versions: {
              v1: {
                is_complete: true,
                released_at: "2026-06-21T07:16:20.303Z",
                checked_at: "2026-06-22T07:16:20.303Z",
              },
            },
          },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({}),
      [`${base}/index.json`]: JSON.stringify({ mods: ["release-source-mod"] }),
      [`${base}/release-source-mod/manifest.json`]: JSON.stringify({
        name: "Release Source Mod",
        first_released: 1_710_000_000,
      }),
    });

    const items = await loadRegistryItemsForType("mods", "mods");

    expect(items[0]?.publishedAt).toBe(1_710_000_000_000);
  });

  it("derives published date from earliest complete version release date", async () => {
    const base = "/registry-cache/mods";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        listings: {
          "derived-release-mod": {
            has_complete_version: true,
            versions: {
              v1: {
                is_complete: true,
                released_at: "2026-06-21T07:16:20.303Z",
                checked_at: "2026-06-23T07:16:20.303Z",
              },
              v2: {
                is_complete: true,
                released_at: "2026-06-20T07:16:20.303Z",
                checked_at: "2026-06-22T07:16:20.303Z",
              },
            },
          },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({}),
      [`${base}/index.json`]: JSON.stringify({ mods: ["derived-release-mod"] }),
      [`${base}/derived-release-mod/manifest.json`]: JSON.stringify({
        name: "Derived Release Mod",
      }),
    });

    const items = await loadRegistryItemsForType("mods", "mods");

    expect(items[0]?.publishedAt).toBe(Date.parse("2026-06-20T07:16:20.303Z"));
  });

  it("keeps the debut date of a listing whose earliest versions were retired", async () => {
    const base = "/registry-cache/maps";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        listings: {
          "retired-debut-map": {
            has_complete_version: true,
            versions: {
              "0.1.0": { availability: "retired", released_at: "2026-06-01T00:00:00.000Z" },
              "0.2.0": { availability: "removed", released_at: "2026-06-10T00:00:00.000Z" },
              "0.3.0": {
                is_complete: true,
                released_at: "2026-08-13T00:00:00.000Z",
                checked_at: "2026-08-14T00:00:00.000Z",
              },
            },
          },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({}),
      [`${base}/index.json`]: JSON.stringify({ maps: ["retired-debut-map"] }),
      [`${base}/retired-debut-map/manifest.json`]: JSON.stringify({ name: "Retired Debut Map" }),
    });

    const items = await loadRegistryItemsForType("maps", "maps");

    expect(items[0]?.publishedAt).toBe(Date.parse("2026-06-01T00:00:00.000Z"));
    expect(items[0]?.latestVersion).toBe("0.3.0");
  });

  it("returns zero downloads and null thumbnail when optional data is missing", async () => {
    const base = "/registry-cache/maps";

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

  it("uses absolute gallery URLs as card thumbnails", async () => {
    const base = "/registry-cache/maps";
    const remoteThumbnail =
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123/maps/alpha/gallery/preview.webp";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        listings: { alpha: { has_complete_version: true, versions: {} } },
      }),
      [`${base}/downloads.json`]: JSON.stringify({}),
      [`${base}/index.json`]: JSON.stringify({ maps: ["alpha"] }),
      [`${base}/alpha/manifest.json`]: JSON.stringify({
        name: "Alpha",
        gallery: [remoteThumbnail, "gallery/second.webp"],
      }),
    });

    const items = await loadRegistryItemsForType("maps", "maps");

    expect(items[0]?.thumbnailSrc).toBe(remoteThumbnail);
  });

  it("keeps legacy relative gallery thumbnails on the local-cache fallback", async () => {
    const base = "/registry-cache/maps";

    mockFetchWithMap({
      [`${base}/integrity.json`]: JSON.stringify({
        listings: { alpha: { has_complete_version: true, versions: {} } },
      }),
      [`${base}/downloads.json`]: JSON.stringify({}),
      [`${base}/index.json`]: JSON.stringify({ maps: ["alpha"] }),
      [`${base}/alpha/manifest.json`]: JSON.stringify({
        name: "Alpha",
        gallery: ["gallery/preview.webp"],
      }),
    });

    const items = await loadRegistryItemsForType("maps", "maps");

    expect(items[0]?.thumbnailSrc).toBe("/registry-cache/maps/alpha/gallery/preview.webp");
  });

  it("excludes items that fail integrity completeness", async () => {
    const base = "/registry-cache/mods";

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

  it("includes deprecated listings despite zero complete versions and flags them", async () => {
    const base = "/registry-cache/mods";

    mockFetchWithMap({
      // The registry pipeline's deprecation overlay reports deprecated
      // listings with every version incomplete — they must still load.
      [`${base}/integrity.json`]: JSON.stringify({
        listings: {
          "sunset-mod": {
            has_complete_version: false,
            versions: {
              v1: { is_complete: false, checked_at: "2025-02-02T00:00:00.000Z" },
            },
          },
          "active-mod": {
            has_complete_version: true,
            versions: {
              v1: { is_complete: true, checked_at: "2025-02-02T00:00:00.000Z" },
            },
          },
          "delisted-mod": {
            has_complete_version: false,
            versions: {
              v1: { is_complete: false, checked_at: "2025-02-02T00:00:00.000Z" },
            },
          },
        },
      }),
      [`${base}/downloads.json`]: JSON.stringify({ "sunset-mod": { v1: 41 } }),
      [`${base}/index.json`]: JSON.stringify({
        mods: ["sunset-mod", "active-mod", "delisted-mod"],
      }),
      [`${base}/sunset-mod/manifest.json`]: JSON.stringify({
        name: "Sunset Mod",
        deprecation: { since: "2026-08-03T00:00:00Z", by_github_id: 1, reason: "Superseded" },
      }),
      [`${base}/active-mod/manifest.json`]: JSON.stringify({ name: "Active Mod" }),
      [`${base}/delisted-mod/manifest.json`]: JSON.stringify({ name: "Delisted Mod" }),
    });

    const items = await loadRegistryItemsForType("mods", "mods");
    const ids = items.map((item) => item.id).sort();

    // Deprecated listing stays (with flag + downloads intact for attribution);
    // an incomplete listing WITHOUT a deprecation record stays delisted.
    expect(ids).toEqual(["active-mod", "sunset-mod"]);
    const sunset = items.find((item) => item.id === "sunset-mod");
    expect(sunset?.isDeprecated).toBe(true);
    expect(sunset?.totalDownloads).toBe(41);
    expect(items.find((item) => item.id === "active-mod")?.isDeprecated).toBe(false);
  });
});
