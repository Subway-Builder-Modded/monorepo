import { describe, expect, it } from "vitest";
import { getDetailsTabSections } from "@/features/registry/detail/config/details-tab-config";
import { normalizeRegistryDetail } from "@/features/registry/detail/lib/normalize-registry-detail";
import type { RegistryDetailLoadedData } from "@/features/registry/detail/registry-detail-types";

const BASE: RegistryDetailLoadedData = {
  typeConfig: {
    id: "maps",
    label: "Map",
    pluralLabel: "Maps",
    routeSegment: "maps",
    accentLight: "#2563eb",
    accentDark: "#60a5fa",
  },
  item: {
    id: "asset-a",
    type: "maps",
    routeSegment: "maps",
    name: "Asset A",
    author: "Author A",
    authorId: "author-a",
    description: "Fallback description",
    tags: ["tag-a"],
    thumbnailSrc: null,
    totalDownloads: 1284,
    cityCode: "AAA",
    countryCode: "AA",
    countryName: "Country A",
    population: 14_000,
  },
  manifest: {
    description: "# Asset A\n\nDetailed description",
    gallery: [
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123/maps/asset-a/gallery/shot.png",
      "gallery/legacy.png",
      "https://cdn.example.test/remote.png",
      "/absolute.png",
      "",
    ],
    source: "https://example.test/source",
    source_quality: "high-quality",
    data_quality: { tier: "high", weighted_score: 0.66, rubric_version: 1 },
    level_of_detail: "medium-detail",
    tags: ["high-quality", "tag-b"],
    grid_statistics: {
      detail: {
        playableAreaKm2: 5617,
      },
    },
    update: {
      type: "github",
      repo: "owner/repo",
      url: "https://updates.example.test/asset-a.json",
    },
    last_updated: 1_772_000_000,
  },
  listingVersions: {
    "1.0.0": {
      is_complete: true,
      checked_at: "2026-04-25T00:00:00.000Z",
      source: {
        download_url: "https://downloads.example.test/asset-a-1.0.0.zip",
        repo: "owner/repo",
        tag: "v1.0.0",
      },
    },
    "0.9.0": {
      is_complete: true,
      checked_at: "2026-03-01T00:00:00.000Z",
      source: {
        download_url: "https://downloads.example.test/asset-a-0.9.0.zip",
      },
    },
    "0.1.0": { is_complete: false, checked_at: "2026-01-01T00:00:00.000Z" },
  },
  listingLatestSemverVersion: "1.0.0",
  listingLatestSemverComplete: true,
  listingLastUpdated: 1_771_000_000,
  listingCompleteVersions: ["1.0.0", "0.9.0"],
  versionReleaseDates: {
    "1.0.0": "2026-04-24T00:00:00.000Z",
    "0.9.0": "2026-02-28T00:00:00.000Z",
  },
  versionDownloads: {
    "1.0.0": 10,
    "0.9.0": 4,
  },
  authorAttributionHref: "https://example.test/author-a",
  collaborators: [{ authorId: "author-b", authorLabel: "Author B" }],
  projectId: null,
  downloadAnalytics: {
    rank: 3,
    allTime: 1284,
    last14Days: 140,
    last7Days: 70,
  },
  downloadHistory: [{ date: "2026-04-25", downloads: 10 }],
  downloadTrends: [{ period: "7d", label: "7 days", downloads: 70, rank: 4 }],
  mapRankings: null,
};

describe("normalizeRegistryDetail", () => {
  it("normalizes a complete map detail model without real cache fixtures", () => {
    const model = normalizeRegistryDetail(BASE);

    expect(model).toMatchObject({
      id: "asset-a",
      name: "Asset A",
      authorLabel: "Author A",
      authorId: "author-a",
      authorHref: "https://example.test/author-a",
      sourceCodeLink: { label: "Source", href: "https://example.test/source" },
      downloads: 1284,
      latestVersion: "1.0.0",
      latestDownloadUrl: "https://downloads.example.test/asset-a-1.0.0.zip",
      publishedDate: "2026-02-28T00:00:00.000Z",
      updatedDate: "2026-02-25T06:13:20.000Z",
      integrityVersionCount: 2,
    });
    expect(model.tags).toEqual(["tag-b", "tag-a"]);
    expect(model.galleryImages).toEqual([
      "https://raw.githubusercontent.com/Subway-Builder-Modded/registry/abc123/maps/asset-a/gallery/shot.png",
      "/registry-cache/maps/asset-a/gallery/legacy.png",
      "https://cdn.example.test/remote.png",
      "/absolute.png",
    ]);
    expect(model.versions).toMatchObject([
      { version: "1.0.0", downloads: 10, sourceRepo: "owner/repo", sourceTag: "v1.0.0" },
      { version: "0.9.0", downloads: 4 },
    ]);
    expect(model.mapFields).toMatchObject({
      cityCode: "AAA",
      countryCode: "AA",
      country: "Country A",
      population: 14_000,
      playableAreaKm2: 5617,
      dataQuality: "High",
      levelOfDetail: "Medium",
    });
  });

  it("normalizes missing optional fields for non-map items", () => {
    const model = normalizeRegistryDetail({
      ...BASE,
      item: {
        ...BASE.item,
        id: "asset-b",
        type: "mods",
        routeSegment: "mods",
        cityCode: null,
        countryCode: null,
        countryName: null,
        population: null,
      },
      manifest: {},
      listingLatestSemverVersion: null,
      listingLatestSemverComplete: false,
      listingLastUpdated: null,
      listingCompleteVersions: [],
      listingVersions: {},
      versionReleaseDates: {},
      versionDownloads: {},
      authorAttributionHref: null,
      collaborators: [],
      downloadHistory: [],
      downloadTrends: [],
    });

    expect(model.mapFields).toBeNull();
    expect(model.versions).toEqual([]);
    expect(model.latestDownloadUrl).toBeNull();
    expect(model.galleryImages).toEqual([]);
    expect(model.sourceCodeLink).toBeNull();
    expect(model.publishedDate).toBeNull();
    expect(model.updatedDate).toBeNull();
    expect(model.integrityVersionCount).toBe(0);
  });

  it("categorizes map file sizes and sums uncategorized files", () => {
    const model = normalizeRegistryDetail({
      ...BASE,
      manifest: {
        ...BASE.manifest,
        file_sizes: {
          "asset.pmtiles.gz": 18.2,
          "buildings_index.json.gz": 42,
          "buildings_index.bin.gz": 24,
          "demand_data.json.gz": 4.35,
          "ocean_depth_index.json.gz": 2.63,
          "roads.geojson.gz": 11.46,
          "runways_taxiways.geojson.gz": 0,
          "water.geojson": 7.5,
          "config.json": 0.01,
        },
      },
    });

    expect(model.mapFields?.fileSizes).toEqual({
      pmtiles: 18.2,
      buildingsIndexJson: 42,
      buildingsIndexBin: 24,
      demandData: 4.35,
      oceanDepthIndex: 2.63,
      roads: 11.46,
      runwaysTaxiways: null,
      other: 7.51,
    });
  });

  it("renders buildings index file size cards only for present formats", () => {
    const baseModel = normalizeRegistryDetail({
      ...BASE,
      manifest: {
        ...BASE.manifest,
        file_sizes: {
          "asset.pmtiles": 18.2,
          "demand_data.json": 4.35,
          "roads.geojson": 11.46,
        },
      },
    });
    const jsonModel = normalizeRegistryDetail({
      ...BASE,
      manifest: {
        ...BASE.manifest,
        file_sizes: {
          "buildings_index.json.gz": 42,
        },
      },
    });
    const binModel = normalizeRegistryDetail({
      ...BASE,
      manifest: {
        ...BASE.manifest,
        file_sizes: {
          "buildings_index.bin.gz": 24,
        },
      },
    });
    const bothModel = normalizeRegistryDetail({
      ...BASE,
      manifest: {
        ...BASE.manifest,
        file_sizes: {
          "buildings_index.json": 42,
          "buildings_index.bin.gz": 24,
        },
      },
    });

    const getFileSizeTitles = (model: typeof baseModel) =>
      getDetailsTabSections(model)
        .find((section) => section.title === "File Sizes")
        ?.cards.map((card) => card.title) ?? [];

    expect(getFileSizeTitles(baseModel)).not.toContain("Buildings Index (JSON)");
    expect(getFileSizeTitles(baseModel)).not.toContain("Buildings Index (BIN)");
    expect(getFileSizeTitles(jsonModel)).toContain("Buildings Index (JSON)");
    expect(getFileSizeTitles(jsonModel)).not.toContain("Buildings Index (BIN)");
    expect(getFileSizeTitles(binModel)).not.toContain("Buildings Index (JSON)");
    expect(getFileSizeTitles(binModel)).toContain("Buildings Index (BIN)");
    expect(getFileSizeTitles(bothModel)).toEqual(
      expect.arrayContaining(["Buildings Index (JSON)", "Buildings Index (BIN)"]),
    );
  });
});
