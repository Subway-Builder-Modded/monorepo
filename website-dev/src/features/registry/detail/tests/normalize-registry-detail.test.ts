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
    update: {
      type: "github",
      repo: "example/repo",
    },
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
  listingCompleteVersions: ["1.0.0", "0.9.0"],
  versionDownloads: {
    "1.0.0": 10,
    "0.9.0": 4,
  },
  authorAttributionHref: "https://github.com/rslurry",
};

describe("normalizeRegistryDetail", () => {
  it("normalizes detail model with versions and map fields", () => {
    const model = normalizeRegistryDetail(BASE);

    expect(model.id).toBe("gwangju-4");
    expect(model.galleryImages).toEqual(["/registry/maps/gwangju-4/gallery/shot.png"]);
    expect(model.sourceCodeLink).toEqual({
      label: "Source Code",
      href: "https://github.com/example/repo",
    });
    expect(model.latestVersion).toBe("1.0.0");
    expect(model.latestDownloadUrl).toBe("https://downloads.example/gwangju-1.0.0.zip");
    expect(model.publishedDate).toBe("2026-03-01T00:00:00.000Z");
    expect(model.updatedDate).toBe("2026-04-25T00:00:00.000Z");
    expect(model.integrityVersionCount).toBe(2);
    expect(model.versions.map((v) => v.version)).toEqual(["1.0.0", "0.9.0"]);
    expect(model.mapFields).toEqual({
      cityCode: "GZ",
      countryCode: "CN",
      country: "China",
      population: 14_000_000,
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
      listingCompleteVersions: [],
      listingVersions: {},
      versionDownloads: {},
      authorAttributionHref: null,
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
});
