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
});
