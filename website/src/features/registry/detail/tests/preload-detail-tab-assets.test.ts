import { describe, expect, it } from "vitest";
import {
  getDetailInitialPreloadTargets,
  preloadDetailTabAssets,
} from "@/features/registry/detail/lib/preload-detail-tab-assets";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";

function makeDetail(overrides: Partial<RegistryDetailModel> = {}): RegistryDetailModel {
  return {
    id: "asset-a",
    typeId: "maps",
    routeSegment: "maps",
    typeConfig: {
      id: "maps",
      label: "Map",
      pluralLabel: "Maps",
      routeSegment: "maps",
      accentLight: "#2563eb",
      accentDark: "#60a5fa",
    },
    name: "Asset A",
    description: "",
    excerpt: null,
    authorLabel: "Author",
    authorId: null,
    authorHref: null,
    collaborators: [],
    sourceCodeLink: null,
    projectId: null,
    tags: [],
    downloads: null,
    downloadAnalytics: { rank: null, allTime: null, last14Days: null, last7Days: null },
    downloadHistory: [],
    downloadTrends: [],
    galleryImages: ["https://cdn.example.test/first.webp", "https://cdn.example.test/second.webp"],
    versions: [],
    versionSource: null,
    latestVersion: null,
    latestDownloadUrl: null,
    publishedDate: null,
    updatedDate: null,
    integrityVersionCount: 0,
    mapFields: null,
    ...overrides,
  };
}

describe("preloadDetailTabAssets", () => {
  it("targets only the first gallery image and the remote basemap for maps", () => {
    expect(getDetailInitialPreloadTargets(makeDetail())).toEqual([
      "https://cdn.example.test/first.webp",
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/map-data/maps/asset-a/basemap.svg",
    ]);
  });

  it("does not preload basemaps for non-map details", () => {
    expect(
      getDetailInitialPreloadTargets(
        makeDetail({
          id: "mod-a",
          typeId: "mods",
          routeSegment: "mods",
          typeConfig: {
            id: "mods",
            label: "Mod",
            pluralLabel: "Mods",
            routeSegment: "mods",
            accentLight: "#2563eb",
            accentDark: "#60a5fa",
          },
        }),
      ),
    ).toEqual(["https://cdn.example.test/first.webp"]);
  });

  it("resolves as best-effort in jsdom", async () => {
    await expect(preloadDetailTabAssets(makeDetail())).resolves.toBeUndefined();
  });
});
