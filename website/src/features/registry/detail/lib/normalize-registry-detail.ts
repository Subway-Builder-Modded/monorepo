import { resolveDataQualityTier } from "@subway-builder-modded/config";

import type {
  RegistryDataQualityLabel,
  RegistryDetailIntegrityVersion,
  RegistryDetailLoadedData,
  RegistryDetailModel,
  RegistryDetailSourceLink,
  RegistryDetailVersion,
} from "@/features/registry/detail/registry-detail-types";
import { getRegistryItemCachePath } from "@/features/registry/lib/registry-asset-paths";

function normalizeVersionKey(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function compareVersionKeysDescending(left: string, right: string): number {
  return normalizeVersionKey(right).localeCompare(normalizeVersionKey(left), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function unixSecondsToIso(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function resolveListingUpdatedDate(data: RegistryDetailLoadedData): string | null {
  return unixSecondsToIso(data.manifest.last_updated) ?? unixSecondsToIso(data.listingLastUpdated);
}

function toExcerpt(input: string): string | null {
  const normalized = input
    .replace(/\s+/g, " ")
    .replace(/[#*_`>[\]-]/g, "")
    .trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177).trimEnd()}...`;
}

const DATA_QUALITY_DISPLAY_LABELS: Record<string, RegistryDataQualityLabel> = {
  "very-high": "Very High",
  high: "High",
  medium: "Medium",
  low: "Low",
  "very-low": "Very Low",
  absent: "Absent",
  unknown: "unknown-quality",
};

function normalizeDataQuality(value: string | undefined): RegistryDataQualityLabel | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return DATA_QUALITY_DISPLAY_LABELS[normalized] ?? null;
}

function normalizeDetailLevel(value: string | undefined): "High" | "Medium" | "Low" | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "high-detail" || normalized === "high") {
    return "High";
  }
  if (normalized === "medium-detail" || normalized === "medium") {
    return "Medium";
  }
  if (normalized === "low-detail" || normalized === "low") {
    return "Low";
  }
  return null;
}

function isMapDemandDataTag(
  normalizedTag: string,
  dataQuality: RegistryDataQualityLabel | null,
  levelOfDetail: "High" | "Medium" | "Low" | null,
): boolean {
  const blocked = new Set([
    "data-quality",
    "source-quality",
    "level-of-detail",
    "high-quality",
    "medium-quality",
    "low-quality",
    "high-detail",
    "medium-detail",
    "low-detail",
    // Data-quality tier values (injected as searchable tags by the cache loader).
    "very-high",
    "high",
    "medium",
    "low",
    "very-low",
    "absent",
    "unknown",
    "unscored",
    "unknown-quality",
  ]);

  if (dataQuality) {
    const qualityBase = dataQuality.toLowerCase();
    blocked.add(qualityBase);
    blocked.add(`${qualityBase}-quality`);
  }

  if (levelOfDetail) {
    const detailBase = levelOfDetail.toLowerCase();
    blocked.add(detailBase);
    blocked.add(`${detailBase}-detail`);
  }

  return blocked.has(normalizedTag);
}

function resolveGalleryImages(
  routeSegment: string,
  id: string,
  gallery: string[] | undefined,
): string[] {
  if (!Array.isArray(gallery) || gallery.length === 0) {
    return [];
  }

  return gallery
    .map((imagePath) => {
      if (!imagePath) {
        return null;
      }

      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }

      if (imagePath.startsWith("/")) {
        return imagePath;
      }

      return getRegistryItemCachePath(routeSegment, id, imagePath);
    })
    .filter((path): path is string => Boolean(path));
}

function resolveSourceCodeLink(
  source: string | undefined,
  update: { type?: string; repo?: string } | undefined,
): RegistryDetailSourceLink | null {
  if (source?.trim()) {
    return { label: "Source", href: source.trim() };
  }

  if (update?.type === "github" && update.repo?.trim()) {
    return { label: "Source", href: `https://github.com/${update.repo.trim()}` };
  }

  return null;
}

function resolveVersions(
  listingVersions: Record<string, RegistryDetailIntegrityVersion>,
  versionReleaseDates: Record<string, string>,
  versionDownloads: Record<string, number>,
): RegistryDetailVersion[] {
  const versions = Object.entries(listingVersions)
    .filter(([, meta]) => meta.is_complete === true)
    .map(([version, meta]) => ({
      version,
      releaseDate: versionReleaseDates[version] ?? meta.checked_at ?? null,
      downloads:
        typeof versionDownloads[version] === "number"
          ? Math.max(0, versionDownloads[version])
          : null,
      downloadUrl: meta.source?.download_url?.trim() || null,
      sourceRepo: meta.source?.repo?.trim() || null,
      sourceTag: meta.source?.tag?.trim() || null,
    }));

  versions.sort((left, right) => {
    return right.version.localeCompare(left.version, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return versions;
}

function resolveIntegrityStats(
  versions: RegistryDetailVersion[],
  listingUpdatedDate: string | null,
): {
  publishedDate: string | null;
  updatedDate: string | null;
  integrityVersionCount: number;
} {
  if (versions.length === 0) {
    return {
      publishedDate: null,
      updatedDate: listingUpdatedDate,
      integrityVersionCount: 0,
    };
  }

  const fallbackUpdatedDate = listingUpdatedDate ?? versions[0]?.releaseDate ?? null;
  const publishedDate = versions[versions.length - 1]?.releaseDate ?? null;

  return {
    publishedDate,
    updatedDate: fallbackUpdatedDate,
    integrityVersionCount: versions.length,
  };
}

function resolveLatestDownloadUrl(data: RegistryDetailLoadedData): string | null {
  const getDownloadUrl = (version: string): string | null => {
    const rawUrl = data.listingVersions[version]?.source?.download_url;
    const normalized = rawUrl?.trim();
    return normalized ? normalized : null;
  };

  if (data.listingLatestSemverComplete && data.listingLatestSemverVersion) {
    const latestVersion = data.listingLatestSemverVersion;
    if (data.listingVersions[latestVersion]?.is_complete === true) {
      const latestUrl = getDownloadUrl(latestVersion);
      if (latestUrl) {
        return latestUrl;
      }
    }
  }

  const completeCandidates = data.listingCompleteVersions
    .filter((version) => data.listingVersions[version]?.is_complete === true)
    .sort(compareVersionKeysDescending);
  for (const version of completeCandidates) {
    const candidate = getDownloadUrl(version);
    if (candidate) {
      return candidate;
    }
  }

  const fallbackCandidates = Object.entries(data.listingVersions)
    .filter(([, meta]) => meta.is_complete === true)
    .sort(([leftVersion, leftMeta], [rightVersion, rightMeta]) => {
      const leftDate = leftMeta.checked_at ? Date.parse(leftMeta.checked_at) : 0;
      const rightDate = rightMeta.checked_at ? Date.parse(rightMeta.checked_at) : 0;
      if (rightDate !== leftDate) {
        return rightDate - leftDate;
      }
      return compareVersionKeysDescending(leftVersion, rightVersion);
    });

  for (const [version] of fallbackCandidates) {
    const candidate = getDownloadUrl(version);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function resolveFileSizeMb(
  fileSizes: Record<string, number> | undefined,
  matcher: (normalizedKey: string) => boolean,
): number | null {
  if (!fileSizes) {
    return null;
  }

  for (const [key, value] of Object.entries(fileSizes)) {
    if (!Number.isFinite(value)) {
      continue;
    }

    const normalizedKey = key.trim().toLowerCase();
    if (!matcher(normalizedKey)) {
      continue;
    }

    return value > 0 ? value : null;
  }

  return null;
}

function isKnownMapFileSizeKey(normalizedKey: string): boolean {
  return (
    matchesFileSizeKey(normalizedKey, ".pmtiles") ||
    matchesFileSizeKey(normalizedKey, "buildings_index.json") ||
    matchesFileSizeKey(normalizedKey, "buildings_index.bin") ||
    matchesFileSizeKey(normalizedKey, "demand_data.json") ||
    matchesFileSizeKey(normalizedKey, "ocean_depth_index.json") ||
    matchesFileSizeKey(normalizedKey, "roads.geojson") ||
    matchesFileSizeKey(normalizedKey, "runways_taxiways.geojson")
  );
}

function matchesFileSizeKey(normalizedKey: string, expectedKey: string): boolean {
  if (expectedKey.startsWith(".")) {
    return normalizedKey.endsWith(expectedKey) || normalizedKey.endsWith(`${expectedKey}.gz`);
  }

  return normalizedKey === expectedKey || normalizedKey === `${expectedKey}.gz`;
}

function resolveOtherMapFileSizes(fileSizes: Record<string, number> | undefined): number | null {
  if (!fileSizes) {
    return null;
  }

  const total = Object.entries(fileSizes).reduce((sum, [key, value]) => {
    if (!Number.isFinite(value) || value <= 0) {
      return sum;
    }

    return isKnownMapFileSizeKey(key.trim().toLowerCase()) ? sum : sum + value;
  }, 0);

  return total > 0 ? total : null;
}

function resolveMapFileSizes(fileSizes: Record<string, number> | undefined) {
  return {
    pmtiles: resolveFileSizeMb(fileSizes, (key) => matchesFileSizeKey(key, ".pmtiles")),
    buildingsIndexJson: resolveFileSizeMb(fileSizes, (key) =>
      matchesFileSizeKey(key, "buildings_index.json"),
    ),
    buildingsIndexBin: resolveFileSizeMb(fileSizes, (key) =>
      matchesFileSizeKey(key, "buildings_index.bin"),
    ),
    demandData: resolveFileSizeMb(fileSizes, (key) => matchesFileSizeKey(key, "demand_data.json")),
    oceanDepthIndex: resolveFileSizeMb(fileSizes, (key) =>
      matchesFileSizeKey(key, "ocean_depth_index.json"),
    ),
    roads: resolveFileSizeMb(fileSizes, (key) => matchesFileSizeKey(key, "roads.geojson")),
    runwaysTaxiways: resolveFileSizeMb(fileSizes, (key) =>
      matchesFileSizeKey(key, "runways_taxiways.geojson"),
    ),
    other: resolveOtherMapFileSizes(fileSizes),
  };
}

export function normalizeRegistryDetail(data: RegistryDetailLoadedData): RegistryDetailModel {
  const description = (data.manifest.description ?? data.item.description ?? "").trim();
  const dataQuality = normalizeDataQuality(resolveDataQualityTier(data.manifest));
  const levelOfDetail = normalizeDetailLevel(data.manifest.level_of_detail);
  const tags = Array.from(
    new Set([...(data.manifest.tags ?? []), ...(data.item.tags ?? [])]),
  ).filter((tag) => {
    if (data.item.type !== "maps") {
      return true;
    }
    const normalizedTag = tag.trim().toLowerCase();
    return !isMapDemandDataTag(normalizedTag, dataQuality, levelOfDetail);
  });
  const listingUpdatedDate = resolveListingUpdatedDate(data);
  const versions = resolveVersions(
    data.listingVersions,
    data.versionReleaseDates,
    data.versionDownloads,
  );
  const latestDownloadUrl = resolveLatestDownloadUrl(data);
  const integrityStats = resolveIntegrityStats(versions, listingUpdatedDate);
  const totalDownloads = Number.isFinite(data.item.totalDownloads)
    ? data.item.totalDownloads
    : null;

  return {
    id: data.item.id,
    typeId: data.item.type,
    routeSegment: data.item.routeSegment,
    typeConfig: data.typeConfig,
    name: (data.manifest.name ?? data.item.name).trim() || data.item.id,
    description,
    excerpt: toExcerpt(description),
    authorLabel: data.item.author,
    authorId: data.item.authorId,
    authorHref: data.authorAttributionHref,
    collaborators: data.collaborators ?? [],
    sourceCodeLink: resolveSourceCodeLink(data.manifest.source, data.manifest.update),
    projectId: data.projectId,
    tags,
    downloads: totalDownloads,
    downloadAnalytics: data.downloadAnalytics ?? {
      rank: null,
      allTime: totalDownloads,
      last14Days: null,
      last7Days: null,
    },
    downloadHistory: data.downloadHistory ?? [],
    downloadTrends: data.downloadTrends ?? [],
    galleryImages: resolveGalleryImages(
      data.item.routeSegment,
      data.item.id,
      data.manifest.gallery,
    ),
    versions,
    latestVersion: versions[0]?.version ?? null,
    latestDownloadUrl,
    publishedDate: integrityStats.publishedDate,
    updatedDate: integrityStats.updatedDate,
    integrityVersionCount: integrityStats.integrityVersionCount,
    mapFields:
      data.item.type === "maps"
        ? {
          rankings: data.mapRankings ?? {
            population: null,
            populationCount: null,
            pointsCount: null,
            playableAreaKm2: null,
          },
          cityCode: data.item.cityCode,
          countryCode: data.item.countryCode,
          country: data.item.countryName,
          population: data.item.population,
          populationCount:
            typeof data.manifest.population_count === "number" &&
              Number.isFinite(data.manifest.population_count)
              ? data.manifest.population_count
              : null,
          pointsCount:
            typeof data.manifest.points_count === "number" &&
              Number.isFinite(data.manifest.points_count)
              ? data.manifest.points_count
              : null,
          playableAreaKm2:
            typeof data.manifest.grid_statistics?.detail?.playableAreaKm2 === "number" &&
              Number.isFinite(data.manifest.grid_statistics.detail.playableAreaKm2)
              ? data.manifest.grid_statistics.detail.playableAreaKm2
              : null,
          dataQuality,
          weightedScore:
            typeof data.manifest.data_quality?.weighted_score === "number" &&
              Number.isFinite(data.manifest.data_quality.weighted_score)
              ? data.manifest.data_quality.weighted_score
              : null,
          levelOfDetail,
          fileSizes: resolveMapFileSizes(data.manifest.file_sizes),
        }
        : null,
    versionSource: data.manifest.update
      ? {
        updateType: data.manifest.update.type?.trim() || null,
        updateUrl: data.manifest.update.url?.trim() || null,
      }
      : null,
  };
}
