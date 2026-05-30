import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import type {
  RegistryDetailCollaborator,
  RegistryDetailLoadedData,
} from "@/features/registry/detail/registry-detail-types";

type RawManifest = {
  name?: string;
  description?: string;
  tags?: string[];
  gallery?: string[];
  source?: string;
  source_quality?: string;
  level_of_detail?: string;
  population_count?: number;
  points_count?: number;
  grid_statistics?: {
    detail?: {
      playableAreaKm2?: number;
    };
  };
  update?: {
    type?: string;
    repo?: string;
    url?: string;
  };
  collaborators?: unknown[];
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
    github_id?: number | string;
    author_id?: string;
    author_alias?: string;
    attribution_link?: string;
  }>;
};

let allRegistryManifestsPromise: Promise<RawManifest[]> | null = null;

function toGithubId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

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

function resolveCollaborators(
  manifest: RawManifest,
  authorsIndex: RawAuthorsIndex,
  mainAuthorId: string | null,
): RegistryDetailCollaborator[] {
  const collaboratorIds = Array.isArray(manifest.collaborators) ? manifest.collaborators : [];
  if (collaboratorIds.length === 0) {
    return [];
  }

  const authorByGithubId = new Map<number, { authorId: string; authorLabel: string }>();
  for (const author of authorsIndex.authors ?? []) {
    const githubId = toGithubId(author.github_id);
    const authorId = author.author_id?.trim();
    if (githubId === null || !authorId) {
      continue;
    }

    const authorLabel = author.author_alias?.trim() || authorId;
    authorByGithubId.set(githubId, { authorId, authorLabel });
  }

  const normalizedMainAuthorId = mainAuthorId?.trim().toLowerCase() ?? null;
  const seenAuthorIds = new Set<string>();
  const result: RegistryDetailCollaborator[] = [];

  for (const collaboratorId of collaboratorIds) {
    const githubId = toGithubId(collaboratorId);
    if (githubId === null) {
      continue;
    }

    const matchedAuthor = authorByGithubId.get(githubId);
    if (!matchedAuthor) {
      continue;
    }

    const normalizedAuthorId = matchedAuthor.authorId.toLowerCase();
    if (normalizedMainAuthorId && normalizedAuthorId === normalizedMainAuthorId) {
      continue;
    }

    if (seenAuthorIds.has(normalizedAuthorId)) {
      continue;
    }

    seenAuthorIds.add(normalizedAuthorId);
    result.push(matchedAuthor);
  }

  return result;
}

function extractGithubRepoSlugFromPathParts(parts: string[]): string | null {
  const owner = parts[0]?.trim();
  const repo = parts[1]?.replace(/\.git$/i, "").trim();
  if (!owner || !repo) {
    return null;
  }
  return `${owner}/${repo}`;
}

function extractGithubRepoSlugFromUrl(rawUrl: string | undefined): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.endsWith(".github.io")) {
      const owner = hostname.replace(/\.github\.io$/i, "").trim();
      const repo = parsed.pathname
        .split("/")
        .filter(Boolean)
        .at(0)
        ?.replace(/\.git$/i, "")
        .trim();
      if (owner && repo) {
        return `${owner}/${repo}`;
      }
      return null;
    }

    if (
      hostname !== "github.com" &&
      hostname !== "www.github.com" &&
      hostname !== "raw.githubusercontent.com"
    ) {
      return null;
    }
    return extractGithubRepoSlugFromPathParts(parsed.pathname.split("/").filter(Boolean));
  } catch {
    const ghPagesMatch = trimmed.match(/^https?:\/\/([^./?#]+)\.github\.io\/([^/?#]+)/i);
    if (ghPagesMatch) {
      const owner = ghPagesMatch[1]?.trim();
      const repo = ghPagesMatch[2]?.replace(/\.git$/i, "").trim();
      if (owner && repo) {
        return `${owner}/${repo}`;
      }
    }

    const matched = trimmed.match(
      /(?:github\.com|raw\.githubusercontent\.com)\/([^/?#]+)\/([^/?#]+)/i,
    );
    if (!matched) {
      return null;
    }
    const owner = matched[1]?.trim();
    const repo = matched[2]?.replace(/\.git$/i, "").trim();
    if (!owner || !repo) {
      return null;
    }
    return `${owner}/${repo}`;
  }
}

function resolveProjectId(
  currentManifest: RawManifest,
  allManifests: RawManifest[],
): string | null {
  const currentRepo = extractGithubRepoSlugFromUrl(currentManifest.source);
  if (!currentRepo) {
    return null;
  }

  const count = allManifests.filter((manifest) => {
    return extractGithubRepoSlugFromUrl(manifest.source) === currentRepo;
  }).length;

  return count > 1 ? currentRepo : null;
}

async function loadAllRegistryManifests(): Promise<RawManifest[]> {
  if (!allRegistryManifestsPromise) {
    allRegistryManifestsPromise = Promise.all(
      REGISTRY_TYPES.map((typeConfig) =>
        loadRegistryItemsForType(typeConfig.id, typeConfig.routeSegment).catch(() => []),
      ),
    ).then((itemsByType) =>
      itemsByType
        .flat()
        .map((entry) => entry.manifest)
        .filter((entry): entry is RawManifest => Boolean(entry && typeof entry === "object")),
    );
  }

  return allRegistryManifestsPromise;
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
  const allManifests = await loadAllRegistryManifests();
  const projectId = resolveProjectId(manifest, allManifests);
  const collaborators = resolveCollaborators(manifest, authorsIndex, item.authorId);

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
    collaborators,
    projectId,
  };
}
