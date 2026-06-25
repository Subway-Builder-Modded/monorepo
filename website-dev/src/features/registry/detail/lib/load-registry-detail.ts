import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import {
  REGISTRY_CACHE_PUBLIC_BASE,
  getRegistryAuthorsIndexPath,
  getRegistryCollectionCachePath,
  getRegistryItemCachePath,
} from "@/features/registry/lib/registry-asset-paths";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import { getRegistryTypeUiRules } from "@/features/registry/registry-type-ui";
import type {
  RegistryDetailCollaborator,
  RegistryDetailDownloadHistoryPoint,
  RegistryDetailDownloadTrend,
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
  last_updated?: number;
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
      last_updated?: number;
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

type ReleaseCache = {
  repos?: Record<string, Array<{ tag_name?: string; published_at?: string }>>;
  custom_urls?: Record<string, Array<{ version?: string; date?: string }>>;
};

let allRegistryManifestsPromise: Promise<RawManifest[]> | null = null;
type MapRankingData = {
  population: number | null;
  populationCount: number | null;
  pointsCount: number | null;
  playableAreaKm2: number | null;
};

type ListingDownloadDailyData = {
  last14Days: number | null;
  last7Days: number | null;
  history: RegistryDetailDownloadHistoryPoint[];
};

type TrendPeriod = RegistryDetailDownloadTrend["period"];

function computeRank(
  id: string,
  items: Array<{ id: string; value: number | null }>,
): number | null {
  const sorted = items
    .filter((item) => item.value !== null)
    .sort((a, b) => (b.value as number) - (a.value as number));
  const index = sorted.findIndex((item) => item.id === id);
  return index === -1 ? null : index + 1;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  result.push(current);
  return result;
}

function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const [headerLine, ...bodyLines] = lines;
  if (!headerLine || bodyLines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(headerLine).map((header) => header.trim());
  return bodyLines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, (values[index] ?? "").trim()]),
    );
  });
}

function extractDailyDownloadHistory(
  row: Record<string, string>,
): RegistryDetailDownloadHistoryPoint[] {
  const points = Object.entries(row)
    .filter(([key]) => /^\d{4}_\d{2}_\d{2}$/.test(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({
      date: key.replace(/_/g, "-"),
      downloads: Number(value) || 0,
    }));

  return points.length > 1 ? points.slice(1) : [];
}

function trimLeadingZeroDownloadHistory(
  history: RegistryDetailDownloadHistoryPoint[],
): RegistryDetailDownloadHistoryPoint[] {
  const firstNonZeroIndex = history.findIndex((point) => point.downloads > 0);
  if (firstNonZeroIndex <= 0) {
    return history;
  }
  return history.slice(firstNonZeroIndex);
}

function sumLatestDailyDownloads(
  history: RegistryDetailDownloadHistoryPoint[],
  days: number,
): number | null {
  if (history.length === 0) {
    return null;
  }

  return history.slice(-days).reduce((total, point) => total + point.downloads, 0);
}

function resolveDailyDownloadRows(dailyAnalyticsRaw: string | null): Array<Record<string, string>> {
  return dailyAnalyticsRaw ? parseCsvRows(dailyAnalyticsRaw) : [];
}

function resolveListingDownloadDailyData(
  id: string,
  dailyRows: Array<Record<string, string>>,
): ListingDownloadDailyData {
  const row = dailyRows.find((entry) => entry["id"] === id);
  if (!row) {
    return { last14Days: null, last7Days: null, history: [] };
  }

  const history = trimLeadingZeroDownloadHistory(extractDailyDownloadHistory(row));

  return {
    last14Days: sumLatestDailyDownloads(history, 14),
    last7Days: sumLatestDailyDownloads(history, 7),
    history,
  };
}

function getListingTypeForAnalytics(typeId: string): "map" | "mod" {
  return typeId === "maps" ? "map" : "mod";
}

function resolveListingDailyDownloadTrend(
  id: string,
  typeId: string,
  period: TrendPeriod,
  dailyRows: Array<Record<string, string>>,
): RegistryDetailDownloadTrend {
  const labels: Record<TrendPeriod, string> = {
    "1d": "Last 24 Hours",
    "3d": "Last 3 Days",
    "7d": "Last 7 Days",
    "14d": "Last 14 Days",
  };
  const listingType = getListingTypeForAnalytics(typeId);
  const days = period === "14d" ? 14 : Number.parseInt(period, 10);
  const rankedRows = dailyRows
    .filter((row) => row["listing_type"] === listingType)
    .map((row) => {
      const history = trimLeadingZeroDownloadHistory(extractDailyDownloadHistory(row));
      return {
        id: row["id"] ?? "",
        downloads: sumLatestDailyDownloads(history, days),
      };
    })
    .filter((row): row is { id: string; downloads: number } => {
      return Boolean(row.id) && typeof row.downloads === "number" && row.downloads > 0;
    })
    .sort((left, right) => right.downloads - left.downloads);
  const index = rankedRows.findIndex((row) => row.id === id);
  const row = index === -1 ? null : rankedRows[index];

  return {
    period,
    label: labels[period],
    downloads: row?.downloads ?? null,
    rank: index === -1 ? null : index + 1,
  };
}

function resolveListingDownloadTrend(
  id: string,
  typeId: string,
  period: TrendPeriod,
  trendAnalyticsRaw: string | null,
): RegistryDetailDownloadTrend {
  const labels: Record<TrendPeriod, string> = {
    "1d": "Last 24 Hours",
    "3d": "Last 3 Days",
    "7d": "Last 7 Days",
    "14d": "Last 14 Days",
  };

  if (!trendAnalyticsRaw) {
    return { period, label: labels[period], downloads: null, rank: null };
  }

  const listingType = getListingTypeForAnalytics(typeId);
  const rows = parseCsvRows(trendAnalyticsRaw).filter((row) => Number(row["download_change"]) > 0);
  const row = rows.find((entry) => entry["id"] === id && entry["listing_type"] === listingType);
  if (!row) {
    return { period, label: labels[period], downloads: null, rank: null };
  }

  const index = rows.findIndex(
    (entry) => entry["id"] === id && entry["listing_type"] === listingType,
  );
  const downloads = Number(row["download_change"]);

  return {
    period,
    label: labels[period],
    downloads: Number.isFinite(downloads) ? downloads : null,
    rank: index === -1 ? null : index + 1,
  };
}

function computeMapRankings(
  id: string,
  allItems: Array<{ id: string; manifest: unknown; population: number | null }>,
): MapRankingData {
  const getManifestNumber = (
    manifest: unknown,
    getter: (m: RawManifest) => number | undefined,
  ): number | null => {
    const m = manifest as RawManifest;
    const value = getter(m);
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };

  const populationItems = allItems.map((item) => ({ id: item.id, value: item.population }));
  const populationCountItems = allItems.map((item) => ({
    id: item.id,
    value: getManifestNumber(item.manifest, (m) => m.population_count),
  }));
  const pointsCountItems = allItems.map((item) => ({
    id: item.id,
    value: getManifestNumber(item.manifest, (m) => m.points_count),
  }));
  const playableAreaItems = allItems.map((item) => ({
    id: item.id,
    value: getManifestNumber(item.manifest, (m) => m.grid_statistics?.detail?.playableAreaKm2),
  }));

  return {
    population: computeRank(id, populationItems),
    populationCount: computeRank(id, populationCountItems),
    pointsCount: computeRank(id, pointsCountItems),
    playableAreaKm2: computeRank(id, playableAreaItems),
  };
}

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

function normalizeVersionKey(version: string | undefined): string {
  return (version ?? "").trim().replace(/^v/i, "").toLowerCase();
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

function resolveVersionReleaseDates(
  manifest: RawManifest,
  listingVersions: NonNullable<RawIntegrity["listings"]>[string]["versions"] | undefined,
  releaseCache: ReleaseCache,
): Record<string, string> {
  const result: Record<string, string> = {};
  const update = manifest.update;
  const entries = Object.entries(listingVersions ?? {});

  if (update?.type === "github" && update.repo?.trim()) {
    const releases = releaseCache.repos?.[update.repo.trim().toLowerCase()] ?? [];
    const releaseByVersion = new Map(
      releases
        .filter((release) => release.published_at?.trim())
        .map((release) => [normalizeVersionKey(release.tag_name), release.published_at!.trim()]),
    );

    for (const [version, meta] of entries) {
      const date =
        releaseByVersion.get(normalizeVersionKey(meta.source?.tag)) ??
        releaseByVersion.get(normalizeVersionKey(version));
      if (date) {
        result[version] = date;
      }
    }
  }

  if (update?.type === "custom" && update.url?.trim()) {
    const versions = releaseCache.custom_urls?.[update.url.trim()] ?? [];
    const dateByVersion = new Map(
      versions
        .filter((entry) => entry.date?.trim())
        .map((entry) => [normalizeVersionKey(entry.version), entry.date!.trim()]),
    );

    for (const [version, meta] of entries) {
      const date =
        dateByVersion.get(normalizeVersionKey(meta.source?.tag)) ??
        dateByVersion.get(normalizeVersionKey(version));
      if (date) {
        result[version] = date;
      }
    }
  }

  return result;
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

  const baseUrl = getRegistryCollectionCachePath(typeConfig.routeSegment);
  const [
    manifestRaw,
    integrityRaw,
    downloadsRaw,
    authorsRaw,
    dailyAnalyticsRaw,
    trend1dRaw,
    trend3dRaw,
    trend7dRaw,
    releaseCacheRaw,
  ] = await Promise.all([
    safeFetchText(getRegistryItemCachePath(typeConfig.routeSegment, id, "manifest.json")),
    safeFetchText(`${baseUrl}/integrity.json`),
    safeFetchText(`${baseUrl}/downloads.json`),
    safeFetchText(getRegistryAuthorsIndexPath()),
    safeFetchText(`${REGISTRY_CACHE_PUBLIC_BASE}/analytics/most_popular_by_day.csv`),
    safeFetchText(`${REGISTRY_CACHE_PUBLIC_BASE}/analytics/most_popular_last_1d.csv`),
    safeFetchText(`${REGISTRY_CACHE_PUBLIC_BASE}/analytics/most_popular_last_3d.csv`),
    safeFetchText(`${REGISTRY_CACHE_PUBLIC_BASE}/analytics/most_popular_last_7d.csv`),
    safeFetchText("/registry-cache/github-releases-cache.json"),
  ]);

  if (!manifestRaw) {
    return null;
  }

  const manifest = safeJson<RawManifest>(manifestRaw, {});
  const integrity = safeJson<RawIntegrity>(integrityRaw ?? "{}", {});
  const downloads = safeJson<RawDownloads>(downloadsRaw ?? "{}", {});
  const authorsIndex = safeJson<RawAuthorsIndex>(authorsRaw ?? "{}", {});
  const releaseCache = safeJson<ReleaseCache>(releaseCacheRaw ?? "{}", {});
  const listing = integrity.listings?.[id];
  const allManifests = await loadAllRegistryManifests();
  const projectId = resolveProjectId(manifest, allManifests);
  const collaborators = resolveCollaborators(manifest, authorsIndex, item.authorId);
  const dailyRows = resolveDailyDownloadRows(dailyAnalyticsRaw);
  const dailyDownloads = resolveListingDownloadDailyData(id, dailyRows);
  const downloadTrends = [
    resolveListingDownloadTrend(id, typeConfig.id, "1d", trend1dRaw),
    resolveListingDownloadTrend(id, typeConfig.id, "3d", trend3dRaw),
    resolveListingDownloadTrend(id, typeConfig.id, "7d", trend7dRaw),
    resolveListingDailyDownloadTrend(id, typeConfig.id, "14d", dailyRows),
  ];
  const downloadAnalytics = {
    rank: computeRank(
      id,
      items.map((entry) => ({
        id: entry.id,
        value: Number.isFinite(entry.totalDownloads) ? entry.totalDownloads : null,
      })),
    ),
    allTime: Number.isFinite(item.totalDownloads) ? item.totalDownloads : null,
    last14Days: dailyDownloads.last14Days,
    last7Days: dailyDownloads.last7Days,
  };
  const { hasMapMetadata } = getRegistryTypeUiRules(typeConfig.id);
  const mapRankings = hasMapMetadata
    ? computeMapRankings(
        id,
        items.map((entry) => ({
          id: entry.id,
          manifest: entry.manifest,
          population: entry.population,
        })),
      )
    : null;

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
    downloadAnalytics,
    downloadHistory: dailyDownloads.history,
    downloadTrends,
    mapRankings,
    manifest,
    listingLastUpdated:
      typeof listing?.last_updated === "number" && Number.isFinite(listing.last_updated)
        ? listing.last_updated
        : null,
    listingLatestSemverVersion: listing?.latest_semver_version ?? null,
    listingLatestSemverComplete: listing?.latest_semver_complete === true,
    listingCompleteVersions: listing?.complete_versions ?? [],
    listingVersions: listing?.versions ?? {},
    versionReleaseDates: resolveVersionReleaseDates(manifest, listing?.versions, releaseCache),
    versionDownloads: downloads[id] ?? {},
    authorAttributionHref: resolveAuthorHref(item.authorId, authorsIndex),
    collaborators,
    projectId,
  };
}
