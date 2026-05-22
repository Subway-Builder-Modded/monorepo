import type {
  RegistryDetailLoadedData,
  RegistryDetailModel,
  RegistryDetailSourceLink,
  RegistryDetailVersion,
} from "@/features/registry/detail/registry-detail-types";

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

function resolveSourceLinks(
  source: string | undefined,
  update: { type?: string; repo?: string; url?: string } | undefined,
): RegistryDetailSourceLink[] {
  const links: RegistryDetailSourceLink[] = [];

  if (source?.trim()) {
    links.push({ label: "Source", href: source.trim() });
  }

  if (update?.type === "github" && update.repo?.trim()) {
    links.push({ label: "Repository", href: `https://github.com/${update.repo.trim()}` });
  }

  if (update?.url?.trim()) {
    links.push({ label: "Update Feed", href: update.url.trim() });
  }

  const deduped = new Map<string, RegistryDetailSourceLink>();
  for (const link of links) {
    if (!deduped.has(link.href)) {
      deduped.set(link.href, link);
    }
  }

  return [...deduped.values()];
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

export function normalizeRegistryDetail(data: RegistryDetailLoadedData): RegistryDetailModel {
  const description = (data.manifest.description ?? data.item.description ?? "").trim();
  const tags = Array.from(new Set([...(data.manifest.tags ?? []), ...(data.item.tags ?? [])]));
  const versions = resolveVersions(data.listingVersions, data.versionDownloads);

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
    tags,
    downloads: Number.isFinite(data.item.totalDownloads) ? data.item.totalDownloads : null,
    sourceLinks: resolveSourceLinks(data.manifest.source, data.manifest.update),
    galleryImages: resolveGalleryImages(
      data.item.routeSegment,
      data.item.id,
      data.manifest.gallery,
    ),
    versions,
    latestVersion: versions[0]?.version ?? null,
    mapFields:
      data.item.type === "maps"
        ? {
            cityCode: data.item.cityCode,
            country: data.item.countryName,
            population: data.item.population,
          }
        : null,
  };
}
