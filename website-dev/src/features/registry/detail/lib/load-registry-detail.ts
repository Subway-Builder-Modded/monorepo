import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import type { RegistryDetailLoadedData } from "@/features/registry/detail/registry-detail-types";

type RawManifest = {
  name?: string;
  description?: string;
  tags?: string[];
  gallery?: string[];
  source?: string;
  update?: {
    type?: string;
    repo?: string;
  };
};

type RawIntegrity = {
  listings?: Record<
    string,
    {
      latest_semver_version?: string;
      latest_semver_complete?: boolean;
      complete_versions?: string[];
      versions?: Record<
        string,
        {
          is_complete?: boolean;
          checked_at?: string;
          source?: {
            update_type?: string;
            repo?: string;
            tag?: string;
            asset_name?: string;
            download_url?: string;
          };
        }
      >;
    }
  >;
};

type RawDownloads = Record<string, Record<string, number>>;

type RawAuthorsIndex = {
  authors?: Array<{
    author_id?: string;
    attribution_link?: string;
  }>;
};

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function safeFetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

function getTypeConfigFromRouteSegment(routeSegment: string) {
  return REGISTRY_TYPES.find((type) => type.routeSegment === routeSegment) ?? null;
}

function resolveAuthorHref(authorId: string | null, authorsIndex: RawAuthorsIndex): string | null {
  if (!authorId) {
    return null;
  }

  const normalizedId = authorId.toLowerCase();
  const entry = (authorsIndex.authors ?? []).find(
    (author) => author.author_id?.toLowerCase() === normalizedId,
  );

  return entry?.attribution_link?.trim() || null;
}

export async function loadRegistryDetail(
  routeSegment: string,
  id: string,
): Promise<RegistryDetailLoadedData | null> {
  const typeConfig = getTypeConfigFromRouteSegment(routeSegment);
  if (!typeConfig) {
    return null;
  }

  const items = await loadRegistryItemsForType(typeConfig.id, typeConfig.routeSegment);
  const item = items.find((candidate) => candidate.id === id) ?? null;
  if (!item) {
    return null;
  }

  const baseUrl = `/registry/${typeConfig.routeSegment}`;
  const [manifestRaw, integrityRaw, downloadsRaw, authorsRaw] = await Promise.all([
    safeFetchText(`${baseUrl}/${id}/manifest.json`),
    safeFetchText(`${baseUrl}/integrity.json`),
    safeFetchText(`${baseUrl}/downloads.json`),
    safeFetchText(`/registry/authors/index.json`),
  ]);

  if (!manifestRaw) {
    return null;
  }

  const manifest = safeJson<RawManifest>(manifestRaw, {});
  const integrity = safeJson<RawIntegrity>(integrityRaw ?? "{}", {});
  const downloads = safeJson<RawDownloads>(downloadsRaw ?? "{}", {});
  const authorsIndex = safeJson<RawAuthorsIndex>(authorsRaw ?? "{}", {});
  const listing = integrity.listings?.[id];

  return {
    typeConfig,
    item: {
      id: item.id,
      type: item.type,
      routeSegment: item.routeSegment,
      name: item.name,
      author: item.author,
      authorId: item.authorId,
      description: item.description,
      tags: item.tags,
      thumbnailSrc: item.thumbnailSrc,
      totalDownloads: item.totalDownloads,
      cityCode: item.cityCode,
      countryCode: item.countryCode,
      countryName: item.countryName,
      population: item.population,
    },
    manifest,
    listingLatestSemverVersion: listing?.latest_semver_version ?? null,
    listingLatestSemverComplete: listing?.latest_semver_complete === true,
    listingCompleteVersions: listing?.complete_versions ?? [],
    listingVersions: listing?.versions ?? {},
    versionDownloads: downloads[id] ?? {},
    authorAttributionHref: resolveAuthorHref(item.authorId, authorsIndex),
  };
}
