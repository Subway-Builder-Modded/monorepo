import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import {
  REGISTRY_CACHE_PUBLIC_BASE,
  getRegistryAuthorsIndexPath,
} from "@/features/registry/lib/registry-asset-paths";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { buildRegistryItemSearchValues } from "@/features/registry/lib/registry-search";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";

export type RegistryAuthorProfile = {
  githubId: number | null;
  authorId: string;
  authorAlias: string;
  attributionMethod: string | null;
  attributionLink: string | null;
  contributorTier: string | null;
};

export type RegistryAuthorPageData = {
  author: RegistryAuthorProfile;
  itemsByType: Record<string, RegistrySearchItem[]>;
  collaborations: RegistrySearchItem[];
  projects: RegistryAuthorProjectSummary[];
  contributorsByItemKey: Record<string, RegistryAuthorContributor[]>;
  overview: RegistryAuthorOverview;
  analytics: RegistryAuthorAnalytics;
};

export type RegistryAuthorContributor = {
  authorId: string;
  authorLabel: string;
};

export type RegistryAuthorProjectSummary = {
  projectId: string;
  projectName: string;
  href: string;
  maps: number;
  mods: number;
  totalDownloads: number;
  rank: number | null;
  searchTerms: string[];
};

export type RegistryAuthorAssetSummary = {
  id: string;
  name: string;
  href: string;
  publishedAt: number;
  latestVersion: string | null;
  latestVersionUpdatedAt: number;
};

export type RegistryAuthorOverview = {
  newestAsset: RegistryAuthorAssetSummary | null;
  mostRecentUpdate: RegistryAuthorAssetSummary | null;
};

export type RegistryAuthorDownloadHistoryPoint = {
  date: string;
  total: number;
  maps: number;
  mods: number;
};

export type RegistryAuthorDownloadTrend = {
  period: "1d" | "3d" | "7d" | "14d";
  label: string;
  downloads: number | null;
  rank: number | null;
};

export type RegistryAuthorRankingRow = {
  id: string;
  name: string;
  href: string;
  downloads: number;
  rank: number | null;
};

export type RegistryAuthorAnalytics = {
  downloads: {
    total: number;
    maps: number;
    mods: number;
  };
  ranks: {
    total: number | null;
    maps: number | null;
    mods: number | null;
  };
  history: RegistryAuthorDownloadHistoryPoint[];
  trends: RegistryAuthorDownloadTrend[];
  rankingsByType: Record<string, RegistryAuthorRankingRow[]>;
};

type RawAuthorsIndex = {
  authors?: Array<{
    github_id?: number;
    author_id?: string;
    author_alias?: string;
    attribution_method?: string;
    attribution_link?: string;
    contributor_tier?: string;
  }>;
};

type ReleaseCache = {
  repos?: Record<string, Array<{ tag_name?: string; name?: string; published_at?: string }>>;
  custom_urls?: Record<string, Array<{ version?: string; date?: string }>>;
};

type RegistryManifestWithUpdate = {
  update?: {
    type?: string;
    repo?: string;
    url?: string;
  };
  collaborators?: unknown[];
};

type ReleaseEntry = {
  version: string | null;
  timestamp: number;
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
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function normalizeAuthorId(value: string) {
  return value.trim().toLowerCase();
}

function toGithubId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getItemKey(item: RegistrySearchItem) {
  return `${item.type}:${item.id}`;
}

function getProjectName(projectId: string) {
  return projectId.split("/").filter(Boolean)[1] ?? projectId;
}

function parseReleaseTimestamp(value: string | undefined | null) {
  const timestamp = Date.parse(value ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
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
  if (!headerLine || bodyLines.length === 0) return [];

  const headers = parseCsvLine(headerLine).map((header) => header.trim());
  return bodyLines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, (values[index] ?? "").trim()]),
    );
  });
}

function extractDailyDownloadHistory(row: Record<string, string>) {
  return Object.entries(row)
    .filter(([key]) => /^\d{4}_\d{2}_\d{2}$/.test(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ({
      date: key.replace(/_/g, "-"),
      downloads: Number(value) || 0,
    }));
}

function sumLatestDailyDownloads(history: Array<{ downloads: number }>, days: number) {
  if (history.length === 0) return null;
  return history.slice(-days).reduce((total, point) => total + point.downloads, 0);
}

function computeRank(id: string, rows: Array<{ id: string; value: number | null }>) {
  const sorted = rows
    .filter((row): row is { id: string; value: number } => row.value !== null)
    .sort((left, right) => right.value - left.value);
  const index = sorted.findIndex((row) => row.id === id);
  return index === -1 ? null : index + 1;
}

async function loadAuthorsIndex(): Promise<RawAuthorsIndex> {
  const response = await fetch(getRegistryAuthorsIndexPath());
  if (!response.ok) {
    return {};
  }
  return safeJson<RawAuthorsIndex>(await response.text(), {});
}

function resolveAuthorProfile(
  authorId: string,
  authorsIndex: RawAuthorsIndex,
): RegistryAuthorProfile {
  const normalized = normalizeAuthorId(authorId);
  const entry = (authorsIndex.authors ?? []).find(
    (author) => normalizeAuthorId(author.author_id ?? "") === normalized,
  );
  const resolvedAuthorId = entry?.author_id?.trim() || authorId;

  return {
    githubId: typeof entry?.github_id === "number" ? entry.github_id : null,
    authorId: resolvedAuthorId,
    authorAlias: entry?.author_alias?.trim() || resolvedAuthorId,
    attributionMethod: entry?.attribution_method?.trim() || null,
    attributionLink: entry?.attribution_link?.trim() || null,
    contributorTier: entry?.contributor_tier?.trim() || null,
  };
}

function getTypeIdForAnalyticsListingType(listingType: string | undefined) {
  return listingType === "map" ? "maps" : listingType === "mod" ? "mods" : null;
}

function getListingTypeForTypeId(typeId: string) {
  return typeId === "maps" ? "map" : "mod";
}

function getAuthorTotals(itemsByType: Record<string, RegistrySearchItem[]>) {
  const maps = (itemsByType.maps ?? []).reduce((sum, item) => sum + item.totalDownloads, 0);
  const mods = (itemsByType.mods ?? []).reduce((sum, item) => sum + item.totalDownloads, 0);
  return { total: maps + mods, maps, mods };
}

function computeAuthorDownloadRanks(
  normalizedAuthorId: string,
  allItemsByType: Record<string, RegistrySearchItem[]>,
) {
  const totalsByAuthor = new Map<string, { total: number; maps: number; mods: number }>();

  for (const typeConfig of REGISTRY_TYPES) {
    for (const item of allItemsByType[typeConfig.id] ?? []) {
      const authorId = normalizeAuthorId(item.authorId ?? "");
      if (!authorId) continue;
      const current = totalsByAuthor.get(authorId) ?? { total: 0, maps: 0, mods: 0 };
      current.total += item.totalDownloads;
      if (typeConfig.id === "maps") current.maps += item.totalDownloads;
      if (typeConfig.id === "mods") current.mods += item.totalDownloads;
      totalsByAuthor.set(authorId, current);
    }
  }

  const rankRows = Array.from(totalsByAuthor.entries()).map(([id, totals]) => ({
    id,
    totals,
  }));

  return {
    total: computeRank(
      normalizedAuthorId,
      rankRows.map((row) => ({ id: row.id, value: row.totals.total })),
    ),
    maps: computeRank(
      normalizedAuthorId,
      rankRows.map((row) => ({ id: row.id, value: row.totals.maps > 0 ? row.totals.maps : null })),
    ),
    mods: computeRank(
      normalizedAuthorId,
      rankRows.map((row) => ({ id: row.id, value: row.totals.mods > 0 ? row.totals.mods : null })),
    ),
  };
}

function computeProjectDownloadRank(
  projectId: string,
  allItemsByType: Record<string, RegistrySearchItem[]>,
) {
  const totalsByProject = new Map<string, number>();
  const assetCountByProject = new Map<string, number>();

  for (const typeConfig of REGISTRY_TYPES) {
    for (const item of allItemsByType[typeConfig.id] ?? []) {
      const itemProjectId = normalizeAuthorId(item.projectId ?? "");
      if (!itemProjectId) continue;
      totalsByProject.set(
        itemProjectId,
        (totalsByProject.get(itemProjectId) ?? 0) + item.totalDownloads,
      );
      assetCountByProject.set(itemProjectId, (assetCountByProject.get(itemProjectId) ?? 0) + 1);
    }
  }

  return computeRank(
    normalizeAuthorId(projectId),
    Array.from(totalsByProject.entries()).map(([id, value]) => ({
      id,
      value: (assetCountByProject.get(id) ?? 0) > 1 ? value : null,
    })),
  );
}

function computeAuthorProjects(
  itemsByType: Record<string, RegistrySearchItem[]>,
  allItemsByType: Record<string, RegistrySearchItem[]>,
): RegistryAuthorProjectSummary[] {
  const projects = new Map<
    string,
    { maps: number; mods: number; totalDownloads: number; searchTerms: Set<string> }
  >();

  for (const item of Object.values(itemsByType).flat()) {
    const projectId = item.projectId?.trim();
    if (!projectId) continue;

    const normalizedProjectId = normalizeAuthorId(projectId);
    const current = projects.get(normalizedProjectId) ?? {
      maps: 0,
      mods: 0,
      totalDownloads: 0,
      searchTerms: new Set<string>(),
    };
    if (item.type === "maps") current.maps += 1;
    if (item.type === "mods") current.mods += 1;
    current.totalDownloads += item.totalDownloads;
    buildRegistryItemSearchValues(item).forEach((term) => current.searchTerms.add(term));
    projects.set(normalizedProjectId, current);
  }

  return Array.from(projects.entries())
    .filter(([, totals]) => totals.maps + totals.mods > 1)
    .map(([projectId, totals]) => ({
      projectId,
      projectName: getProjectName(projectId),
      href: `/registry/authors/${encodeURIComponent(projectId.split("/")[0] ?? "")}/${encodeURIComponent(
        getProjectName(projectId),
      )}`,
      maps: totals.maps,
      mods: totals.mods,
      totalDownloads: totals.totalDownloads,
      rank: computeProjectDownloadRank(projectId, allItemsByType),
      searchTerms: [...totals.searchTerms],
    }))
    .sort((left, right) => right.totalDownloads - left.totalDownloads);
}

function computeAuthorHistory(
  normalizedAuthorId: string,
  dailyRows: Array<Record<string, string>>,
  itemAuthorByTypeAndId: Map<string, string>,
): RegistryAuthorDownloadHistoryPoint[] {
  const byDate = new Map<string, RegistryAuthorDownloadHistoryPoint>();

  for (const row of dailyRows) {
    const typeId = getTypeIdForAnalyticsListingType(row["listing_type"]);
    const id = row["id"] ?? "";
    if (!typeId || itemAuthorByTypeAndId.get(`${typeId}:${id}`) !== normalizedAuthorId) continue;

    for (const point of extractDailyDownloadHistory(row)) {
      const current = byDate.get(point.date) ?? { date: point.date, total: 0, maps: 0, mods: 0 };
      current.total += point.downloads;
      if (typeId === "maps") current.maps += point.downloads;
      if (typeId === "mods") current.mods += point.downloads;
      byDate.set(point.date, current);
    }
  }

  const history = Array.from(byDate.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const firstNonZeroIndex = history.findIndex((point) => point.total > 0);
  return firstNonZeroIndex <= 0 ? history : history.slice(firstNonZeroIndex);
}

function computeAuthorTrends(
  normalizedAuthorId: string,
  dailyRows: Array<Record<string, string>>,
  itemAuthorByTypeAndId: Map<string, string>,
): RegistryAuthorDownloadTrend[] {
  const periods = [
    { period: "1d" as const, label: "Last 24 Hours", days: 1 },
    { period: "3d" as const, label: "Last 3 Days", days: 3 },
    { period: "7d" as const, label: "Last 7 Days", days: 7 },
    { period: "14d" as const, label: "Last 14 Days", days: 14 },
  ];

  return periods.map(({ period, label, days }) => {
    const totalsByAuthor = new Map<string, number>();

    for (const row of dailyRows) {
      const typeId = getTypeIdForAnalyticsListingType(row["listing_type"]);
      const id = row["id"] ?? "";
      if (!typeId) continue;
      const authorId = itemAuthorByTypeAndId.get(`${typeId}:${id}`);
      if (!authorId) continue;
      const downloads = sumLatestDailyDownloads(extractDailyDownloadHistory(row), days);
      if (downloads === null || downloads <= 0) continue;
      totalsByAuthor.set(authorId, (totalsByAuthor.get(authorId) ?? 0) + downloads);
    }

    const downloads = totalsByAuthor.get(normalizedAuthorId) ?? null;

    return {
      period,
      label,
      downloads,
      rank: computeRank(
        normalizedAuthorId,
        Array.from(totalsByAuthor.entries()).map(([id, value]) => ({ id, value })),
      ),
    };
  });
}

function computeRankingRows(
  authorItems: RegistrySearchItem[],
  allItems: RegistrySearchItem[],
): RegistryAuthorRankingRow[] {
  return authorItems.map((item) => ({
    id: item.id,
    name: item.name,
    href: item.href,
    downloads: item.totalDownloads,
    rank: computeRank(
      item.id,
      allItems.map((entry) => ({
        id: entry.id,
        value: Number.isFinite(entry.totalDownloads) ? entry.totalDownloads : null,
      })),
    ),
  }));
}

function buildItemAuthorLookup(allItemsByType: Record<string, RegistrySearchItem[]>) {
  const lookup = new Map<string, string>();
  for (const typeConfig of REGISTRY_TYPES) {
    for (const item of allItemsByType[typeConfig.id] ?? []) {
      const listingType = getListingTypeForTypeId(typeConfig.id);
      lookup.set(`${typeConfig.id}:${item.id}`, normalizeAuthorId(item.authorId ?? ""));
      lookup.set(`${listingType}:${item.id}`, normalizeAuthorId(item.authorId ?? ""));
    }
  }
  return lookup;
}

function getReleaseEntriesForItem(
  item: RegistrySearchItem,
  releaseCache: ReleaseCache,
): ReleaseEntry[] {
  const manifest = item.manifest as RegistryManifestWithUpdate;
  const update = manifest.update;

  if (update?.type === "github" && update.repo?.trim()) {
    return (releaseCache.repos?.[update.repo.trim().toLowerCase()] ?? [])
      .map((release) => ({
        version: release.tag_name?.trim() || release.name?.trim() || null,
        timestamp: parseReleaseTimestamp(release.published_at),
      }))
      .filter((release) => release.timestamp > 0);
  }

  if (update?.type === "custom" && update.url?.trim()) {
    return (releaseCache.custom_urls?.[update.url.trim()] ?? [])
      .map((release) => ({
        version: release.version?.trim() || null,
        timestamp: parseReleaseTimestamp(release.date),
      }))
      .filter((release) => release.timestamp > 0);
  }

  return [];
}

function summarizeAssetFromReleaseCache(
  item: RegistrySearchItem,
  releaseCache: ReleaseCache,
): RegistryAuthorAssetSummary | null {
  const releaseEntries = getReleaseEntriesForItem(item, releaseCache).sort(
    (left, right) => left.timestamp - right.timestamp,
  );

  if (releaseEntries.length === 0) {
    return null;
  }

  const firstRelease = releaseEntries[0];
  const latestRelease = releaseEntries[releaseEntries.length - 1];

  return {
    id: item.id,
    name: item.name,
    href: item.href,
    publishedAt: firstRelease.timestamp,
    latestVersion: latestRelease.version?.trim() || null,
    latestVersionUpdatedAt: latestRelease.timestamp,
  };
}

function computeAuthorOverview(
  itemsByType: Record<string, RegistrySearchItem[]>,
  releaseCache: ReleaseCache,
): RegistryAuthorOverview {
  const assetSummaries = Object.values(itemsByType)
    .flat()
    .map((item) => summarizeAssetFromReleaseCache(item, releaseCache))
    .filter((item): item is RegistryAuthorAssetSummary => item !== null);

  return {
    newestAsset:
      [...assetSummaries].sort((left, right) => right.publishedAt - left.publishedAt)[0] ?? null,
    mostRecentUpdate:
      [...assetSummaries].sort(
        (left, right) => right.latestVersionUpdatedAt - left.latestVersionUpdatedAt,
      )[0] ?? null,
  };
}

function getAuthorCollaborations(
  author: RegistryAuthorProfile,
  normalizedAuthorId: string,
  allItemsByType: Record<string, RegistrySearchItem[]>,
): RegistrySearchItem[] {
  if (author.githubId === null) {
    return [];
  }

  return Object.values(allItemsByType)
    .flat()
    .filter((item) => {
      if (normalizeAuthorId(item.authorId ?? "") === normalizedAuthorId) {
        return false;
      }

      const manifest = item.manifest as RegistryManifestWithUpdate;
      const collaboratorIds = Array.isArray(manifest.collaborators) ? manifest.collaborators : [];
      return collaboratorIds.some(
        (collaboratorId) => toGithubId(collaboratorId) === author.githubId,
      );
    });
}

function buildAuthorByGithubId(authorsIndex: RawAuthorsIndex) {
  const authorByGithubId = new Map<number, RegistryAuthorContributor>();

  for (const author of authorsIndex.authors ?? []) {
    const githubId = toGithubId(author.github_id);
    const authorId = author.author_id?.trim();
    if (githubId === null || !authorId) continue;

    authorByGithubId.set(githubId, {
      authorId,
      authorLabel: author.author_alias?.trim() || authorId,
    });
  }

  return authorByGithubId;
}

function getItemContributors(
  item: RegistrySearchItem,
  authorByGithubId: Map<number, RegistryAuthorContributor>,
): RegistryAuthorContributor[] {
  const manifest = item.manifest as RegistryManifestWithUpdate;
  const collaboratorIds = Array.isArray(manifest.collaborators) ? manifest.collaborators : [];
  const normalizedMainAuthorId = normalizeAuthorId(item.authorId ?? "");
  const seenAuthorIds = new Set<string>();
  const contributors: RegistryAuthorContributor[] = [];

  for (const collaboratorId of collaboratorIds) {
    const githubId = toGithubId(collaboratorId);
    if (githubId === null) continue;

    const contributor = authorByGithubId.get(githubId);
    if (!contributor) continue;

    const normalizedContributorId = normalizeAuthorId(contributor.authorId);
    if (normalizedMainAuthorId && normalizedContributorId === normalizedMainAuthorId) continue;
    if (seenAuthorIds.has(normalizedContributorId)) continue;

    seenAuthorIds.add(normalizedContributorId);
    contributors.push(contributor);
  }

  return contributors;
}

function buildContributorsByItemKey(
  itemsByType: Record<string, RegistrySearchItem[]>,
  authorsIndex: RawAuthorsIndex,
) {
  const authorByGithubId = buildAuthorByGithubId(authorsIndex);
  const entries = Object.values(itemsByType)
    .flat()
    .map((item) => [getItemKey(item), getItemContributors(item, authorByGithubId)] as const)
    .filter(([, contributors]) => contributors.length > 0);

  return Object.fromEntries(entries);
}

export async function loadAuthorPageData(authorId: string): Promise<RegistryAuthorPageData | null> {
  const authorsIndex = await loadAuthorsIndex().catch((): RawAuthorsIndex => ({}));
  const author = resolveAuthorProfile(authorId, authorsIndex);
  const normalizedAuthorId = normalizeAuthorId(author.authorId);

  const allItemEntries = await Promise.all(
    REGISTRY_TYPES.map(async (typeConfig) => {
      const items = await loadRegistryItemsForType(typeConfig.id, typeConfig.routeSegment);
      return [typeConfig.id, items] as const;
    }),
  );

  const allItemsByType = Object.fromEntries(allItemEntries);
  const itemsByType = Object.fromEntries(
    allItemEntries.map(([typeId, items]) => [
      typeId,
      items.filter((item) => normalizeAuthorId(item.authorId ?? "") === normalizedAuthorId),
    ]),
  );
  const collaborations = getAuthorCollaborations(author, normalizedAuthorId, allItemsByType);
  const projects = computeAuthorProjects(itemsByType, allItemsByType);
  const contributorsByItemKey = buildContributorsByItemKey(itemsByType, authorsIndex);
  const hasAssets = Object.values(itemsByType).some((items) => items.length > 0);

  const hasAuthorRecord = authorsIndex.authors?.some(
    (entry) => normalizeAuthorId(entry.author_id ?? "") === normalizedAuthorId,
  );

  if (!hasAssets && collaborations.length === 0 && !hasAuthorRecord) {
    return null;
  }

  const dailyAnalyticsRaw = await safeFetchText(
    `${REGISTRY_CACHE_PUBLIC_BASE}/analytics/most_popular_by_day.csv`,
  );
  const releaseCacheRaw = await safeFetchText(
    `${REGISTRY_CACHE_PUBLIC_BASE}/github-releases-cache.json`,
  );
  const dailyRows = dailyAnalyticsRaw ? parseCsvRows(dailyAnalyticsRaw) : [];
  const releaseCache = safeJson<ReleaseCache>(releaseCacheRaw ?? "{}", {});
  const itemAuthorByTypeAndId = buildItemAuthorLookup(allItemsByType);
  const downloads = getAuthorTotals(itemsByType);
  const analytics: RegistryAuthorAnalytics = {
    downloads,
    ranks: computeAuthorDownloadRanks(normalizedAuthorId, allItemsByType),
    history: computeAuthorHistory(normalizedAuthorId, dailyRows, itemAuthorByTypeAndId),
    trends: computeAuthorTrends(normalizedAuthorId, dailyRows, itemAuthorByTypeAndId),
    rankingsByType: Object.fromEntries(
      REGISTRY_TYPES.map((typeConfig) => [
        typeConfig.id,
        computeRankingRows(itemsByType[typeConfig.id] ?? [], allItemsByType[typeConfig.id] ?? []),
      ]),
    ),
  };

  return {
    author,
    itemsByType,
    collaborations,
    projects,
    contributorsByItemKey,
    overview: computeAuthorOverview(itemsByType, releaseCache),
    analytics,
  };
}
