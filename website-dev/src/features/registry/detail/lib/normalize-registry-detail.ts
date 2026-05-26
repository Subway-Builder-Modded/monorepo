import type {
  RegistryDetailLoadedData,
  RegistryDetailModel,
  RegistryDetailSourceLink,
  RegistryDetailVersion,
} from "@/features/registry/detail/registry-detail-types";

function normalizeVersionKey(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function compareVersionKeysDescending(left: string, right: string): number {
  return normalizeVersionKey(right).localeCompare(normalizeVersionKey(left), undefined, {
    numeric: true,
    sensitivity: "base",
  });
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

      return `/registry/${routeSegment}/${id}/${imagePath}`;
    })
    .filter((path): path is string => Boolean(path));
}

function resolveSourceCodeLink(
  source: string | undefined,
  update: { type?: string; repo?: string } | undefined,
): RegistryDetailSourceLink | null {
  if (source?.trim()) {
    return { label: "Source Code", href: source.trim() };
  }

  if (update?.type === "github" && update.repo?.trim()) {
    return { label: "Source Code", href: `https://github.com/${update.repo.trim()}` };
  }

  return null;
}

function resolveVersions(
  listingVersions: Record<string, { is_complete?: boolean; checked_at?: string }>,
  versionDownloads: Record<string, number>,
): RegistryDetailVersion[] {
  const versions = Object.entries(listingVersions)
    .filter(([, meta]) => meta.is_complete === true)
    .map(([version, meta]) => ({
      version,
      releaseDate: meta.checked_at ?? null,
      downloads:
        typeof versionDownloads[version] === "number"
          ? Math.max(0, versionDownloads[version])
          : null,
    }));

  versions.sort((left, right) => {
    const leftDate = left.releaseDate ? Date.parse(left.releaseDate) : 0;
    const rightDate = right.releaseDate ? Date.parse(right.releaseDate) : 0;
    if (rightDate !== leftDate) {
      return rightDate - leftDate;
    }
    return right.version.localeCompare(left.version, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return versions;
}

function resolveIntegrityStats(versions: RegistryDetailVersion[]): {
  publishedDate: string | null;
  updatedDate: string | null;
  integrityVersionCount: number;
} {
  if (versions.length === 0) {
    return {
      publishedDate: null,
      updatedDate: null,
      integrityVersionCount: 0,
    };
  }

  const updatedDate = versions[0]?.releaseDate ?? null;
  const publishedDate = versions[versions.length - 1]?.releaseDate ?? null;

  return {
    publishedDate,
    updatedDate,
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

export function normalizeRegistryDetail(data: RegistryDetailLoadedData): RegistryDetailModel {
  const description = (data.manifest.description ?? data.item.description ?? "").trim();
  const tags = Array.from(new Set([...(data.manifest.tags ?? []), ...(data.item.tags ?? [])]));
  const versions = resolveVersions(data.listingVersions, data.versionDownloads);
  const latestDownloadUrl = resolveLatestDownloadUrl(data);
  const integrityStats = resolveIntegrityStats(versions);

  return {
    id: data.item.id,
    typeId: data.item.type,
    routeSegment: data.item.routeSegment,
    typeConfig: data.typeConfig,
    name: (data.manifest.name ?? data.item.name).trim() || data.item.id,
    description,
    excerpt: toExcerpt(description),
    authorLabel: data.item.author,
    authorHref: data.authorAttributionHref,
    sourceCodeLink: resolveSourceCodeLink(data.manifest.source, data.manifest.update),
    tags,
    downloads: Number.isFinite(data.item.totalDownloads) ? data.item.totalDownloads : null,
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
            cityCode: data.item.cityCode,
            countryCode: data.item.countryCode,
            country: data.item.countryName,
            population: data.item.population,
          }
        : null,
  };
}
