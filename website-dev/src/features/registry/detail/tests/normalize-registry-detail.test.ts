import { describe, expect, it } from "vitest";
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
    id: "gwangju-4",
    type: "maps",
    routeSegment: "maps",
    name: "Gwangju",
    author: "slurry",
    authorId: "rslurry",
    description: "Map description",
    tags: ["east-asia"],
    thumbnailSrc: null,
    totalDownloads: 1284,
    cityCode: "GZ",
    countryCode: "CN",
    countryName: "China",
    population: 14_000_000,
  },
  manifest: {
    description: "# Gwangju\n\nGreat map",
    gallery: ["gallery/shot.png"],
    source: "https://github.com/example/repo",
    source_quality: "high",
    level_of_detail: "medium",
    grid_statistics: {
      detail: {
        playableAreaKm2: 5617,
      },
    },
    update: {
      type: "github",
      repo: "example/repo",
    },
    last_updated: 1_772_000_000,
  },
  listingVersions: {
    "1.0.0": {
      is_complete: true,
      checked_at: "2026-04-25T00:00:00.000Z",
      source: {
        download_url: "https://downloads.example/gwangju-1.0.0.zip",
      },
    },
    "0.9.0": {
      is_complete: true,
      checked_at: "2026-03-01T00:00:00.000Z",
      source: {
        download_url: "https://downloads.example/gwangju-0.9.0.zip",
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
  authorAttributionHref: "https://github.com/rslurry",
  projectId: null,
  downloadAnalytics: {
    rank: 3,
    allTime: 1284,
    last14Days: 140,
    last7Days: 70,
  },
  mapRankings: null,
};

describe("normalizeRegistryDetail", () => {
  it("normalizes detail model with versions and map fields", () => {
    const model = normalizeRegistryDetail(BASE);

    expect(model.id).toBe("gwangju-4");
    expect(model.galleryImages).toEqual(["/registry-cache/maps/gwangju-4/gallery/shot.png"]);
    expect(model.sourceCodeLink).toEqual({
      label: "Source",
      href: "https://github.com/example/repo",
    });
    expect(model.latestVersion).toBe("1.0.0");
    expect(model.latestDownloadUrl).toBe("https://downloads.example/gwangju-1.0.0.zip");
    expect(model.publishedDate).toBe("2026-02-28T00:00:00.000Z");
    expect(model.updatedDate).toBe("2026-02-25T06:13:20.000Z");
    expect(model.integrityVersionCount).toBe(2);
    expect(model.downloadAnalytics).toEqual({
      rank: 3,
      allTime: 1284,
      last14Days: 140,
      last7Days: 70,
    });
    expect(model.versions).toMatchObject([
      { version: "1.0.0", releaseDate: "2026-04-24T00:00:00.000Z" },
      { version: "0.9.0", releaseDate: "2026-02-28T00:00:00.000Z" },
    ]);
    expect(model.mapFields).toEqual({
      rankings: {
        population: null,
        populationCount: null,
        pointsCount: null,
        playableAreaKm2: null,
      },
      cityCode: "GZ",
      countryCode: "CN",
      country: "China",
      population: 14_000_000,
      populationCount: null,
      pointsCount: null,
      playableAreaKm2: 5617,
      sourceQuality: "High",
      levelOfDetail: "Medium",
      fileSizes: {
        pmtiles: null,
        buildingsIndex: null,
        demandData: null,
        oceanDepthIndex: null,
        roads: null,
        runwaysTaxiways: null,
      },
    });
  });

  it("does not crash when optional fields are missing", () => {
    const model = normalizeRegistryDetail({
      ...BASE,
      item: {
        ...BASE.item,
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
      projectId: null,
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

  it("falls back to checked_at dates when last_updated is unavailable", () => {
    const model = normalizeRegistryDetail({
      ...BASE,
      manifest: {
        ...BASE.manifest,
        last_updated: undefined,
      },
      listingLastUpdated: null,
      versionReleaseDates: {},
    });

    expect(model.publishedDate).toBe("2026-03-01T00:00:00.000Z");
    expect(model.updatedDate).toBe("2026-04-25T00:00:00.000Z");
  });
});
