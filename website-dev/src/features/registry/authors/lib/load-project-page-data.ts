import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";
import {
  REGISTRY_CACHE_PUBLIC_BASE,
  getRegistryAuthorsIndexPath,
} from "@/features/registry/lib/registry-asset-paths";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import type {
  RegistryAuthorAnalytics,
  RegistryAuthorAssetSummary,
  RegistryAuthorContributor,
  RegistryAuthorDownloadHistoryPoint,
  RegistryAuthorDownloadTrend,
  RegistryAuthorOverview,
} from "./load-author-page-data";

export type RegistryProjectProfile = {
  projectId: string;
  projectName: string;
  authorId: string;
  authorLabel: string;
  githubUrl: string;
};

export type RegistryProjectPageData = {
  project: RegistryProjectProfile;
  itemsByType: Record<string, RegistrySearchItem[]>;
  collaborations: RegistrySearchItem[];
  contributorsByItemKey: Record<string, RegistryAuthorContributor[]>;
  overview: RegistryAuthorOverview;
  analytics: RegistryAuthorAnalytics;
};

type RawAuthorsIndex = {
  authors?: Array<{
    github_id?: number | string;
    author_id?: string;
    author_alias?: string;
  }>;
};

type ReleaseCache = {
  repos?: Record<string, Array<{ tag_name?: string; name?: string; published_at?: string }>>;
  custom_urls?: Record<string, Array<{ version?: string; date?: string }>>;
};

type RegistryManifestWithMetadata = {
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

function normalizeId(value: string) {
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

function getListingTypeForTypeId(typeId: string) {
  return typeId === "maps" ? "map" : "mod";
}

function getTypeIdForAnalyticsListingType(listingType: string | undefined) {
  return listingType === "map" ? "maps" : listingType === "mod" ? "mods" : null;
}

function getProjectName(projectId: string) {
  return projectId.split("/").filter(Boolean)[1] ?? projectId;
}

function resolveAuthorLabel(authorId: string, authorsIndex: RawAuthorsIndex) {
  const author = (authorsIndex.authors ?? []).find(
    (entry) => normalizeId(entry.author_id ?? "") === normalizeId(authorId),
  );
  return author?.author_alias?.trim() || author?.author_id?.trim() || authorId;
}

function getProjectTotals(itemsByType: Record<string, RegistrySearchItem[]>) {
  const maps = (itemsByType.maps ?? []).reduce((sum, item) => sum + item.totalDownloads, 0);
  const mods = (itemsByType.mods ?? []).reduce((sum, item) => sum + item.totalDownloads, 0);
  return { total: maps + mods, maps, mods };
}

function buildItemProjectLookup(allItemsByType: Record<string, RegistrySearchItem[]>) {
  const lookup = new Map<string, string>();
  for (const typeConfig of REGISTRY_TYPES) {
    for (const item of allItemsByType[typeConfig.id] ?? []) {
      const projectId = normalizeId(item.projectId ?? "");
      if (!projectId) continue;
      const listingType = getListingTypeForTypeId(typeConfig.id);
      lookup.set(`${typeConfig.id}:${item.id}`, projectId);
      lookup.set(`${listingType}:${item.id}`, projectId);
    }
  }
  return lookup;
}

function buildProjectAssetCounts(allItemsByType: Record<string, RegistrySearchItem[]>) {
  const counts = new Map<string, number>();

  for (const typeConfig of REGISTRY_TYPES) {
    for (const item of allItemsByType[typeConfig.id] ?? []) {
      const projectId = normalizeId(item.projectId ?? "");
      if (!projectId) continue;
      counts.set(projectId, (counts.get(projectId) ?? 0) + 1);
    }
  }

  return counts;
}

function computeProjectDownloadRanks(
  normalizedProjectId: string,
  allItemsByType: Record<string, RegistrySearchItem[]>,
) {
  const totalsByProject = new Map<string, { total: number; maps: number; mods: number }>();
  const assetCountByProject = new Map<string, number>();

  for (const typeConfig of REGISTRY_TYPES) {
    for (const item of allItemsByType[typeConfig.id] ?? []) {
      const projectId = normalizeId(item.projectId ?? "");
      if (!projectId) continue;
      const current = totalsByProject.get(projectId) ?? { total: 0, maps: 0, mods: 0 };
      current.total += item.totalDownloads;
      if (typeConfig.id === "maps") current.maps += item.totalDownloads;
      if (typeConfig.id === "mods") current.mods += item.totalDownloads;
      totalsByProject.set(projectId, current);
      assetCountByProject.set(projectId, (assetCountByProject.get(projectId) ?? 0) + 1);
    }
  }

  const rankRows = Array.from(totalsByProject.entries()).map(([id, totals]) => ({
    id,
    totals,
  }));

  return {
    total: computeRank(
      normalizedProjectId,
      rankRows.map((row) => ({
        id: row.id,
        value: (assetCountByProject.get(row.id) ?? 0) > 1 ? row.totals.total : null,
      })),
    ),
    maps: computeRank(
      normalizedProjectId,
      rankRows.map((row) => ({
        id: row.id,
        value:
          (assetCountByProject.get(row.id) ?? 0) > 1 && row.totals.maps > 0
            ? row.totals.maps
            : null,
      })),
    ),
    mods: computeRank(
      normalizedProjectId,
      rankRows.map((row) => ({
        id: row.id,
        value:
          (assetCountByProject.get(row.id) ?? 0) > 1 && row.totals.mods > 0
            ? row.totals.mods
            : null,
      })),
    ),
  };
}

function computeProjectHistory(
  normalizedProjectId: string,
  dailyRows: Array<Record<string, string>>,
  itemProjectByTypeAndId: Map<string, string>,
): RegistryAuthorDownloadHistoryPoint[] {
  const byDate = new Map<string, RegistryAuthorDownloadHistoryPoint>();

  for (const row of dailyRows) {
    const typeId = getTypeIdForAnalyticsListingType(row["listing_type"]);
    const id = row["id"] ?? "";
    if (!typeId || itemProjectByTypeAndId.get(`${typeId}:${id}`) !== normalizedProjectId) continue;

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

function computeProjectTrends(
  normalizedProjectId: string,
  dailyRows: Array<Record<string, string>>,
  itemProjectByTypeAndId: Map<string, string>,
  projectAssetCounts: Map<string, number>,
): RegistryAuthorDownloadTrend[] {
  const periods = [
    { period: "1d" as const, label: "Last 24 Hours", days: 1 },
    { period: "3d" as const, label: "Last 3 Days", days: 3 },
    { period: "7d" as const, label: "Last 7 Days", days: 7 },
    { period: "14d" as const, label: "Last 14 Days", days: 14 },
  ];

  return periods.map(({ period, label, days }) => {
    const totalsByProject = new Map<string, number>();

    for (const row of dailyRows) {
      const typeId = getTypeIdForAnalyticsListingType(row["listing_type"]);
      const id = row["id"] ?? "";
      if (!typeId) continue;
      const projectId = itemProjectByTypeAndId.get(`${typeId}:${id}`);
      if (!projectId) continue;
      if ((projectAssetCounts.get(projectId) ?? 0) <= 1) continue;
      const downloads = sumLatestDailyDownloads(extractDailyDownloadHistory(row), days);
      if (downloads === null || downloads <= 0) continue;
      totalsByProject.set(projectId, (totalsByProject.get(projectId) ?? 0) + downloads);
    }

    const downloads = totalsByProject.get(normalizedProjectId) ?? null;

    return {
      period,
      label,
      downloads,
      rank: computeRank(
        normalizedProjectId,
        Array.from(totalsByProject.entries()).map(([id, value]) => ({ id, value })),
      ),
    };
  });
}

function computeRankingRows(authorItems: RegistrySearchItem[], allItems: RegistrySearchItem[]) {
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

function parseReleaseTimestamp(value: string | undefined | null) {
  const timestamp = Date.parse(value ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getReleaseEntriesForItem(
  item: RegistrySearchItem,
  releaseCache: ReleaseCache,
): ReleaseEntry[] {
  const manifest = item.manifest as RegistryManifestWithMetadata;
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

function computeProjectOverview(
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
  const manifest = item.manifest as RegistryManifestWithMetadata;
  const collaboratorIds = Array.isArray(manifest.collaborators) ? manifest.collaborators : [];
  const normalizedMainAuthorId = normalizeId(item.authorId ?? "");
  const seenAuthorIds = new Set<string>();
  const contributors: RegistryAuthorContributor[] = [];

  for (const collaboratorId of collaboratorIds) {
    const githubId = toGithubId(collaboratorId);
    if (githubId === null) continue;

    const contributor = authorByGithubId.get(githubId);
    if (!contributor) continue;

    const normalizedContributorId = normalizeId(contributor.authorId);
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

export async function loadProjectPageData(
  authorId: string,
  projectName: string,
): Promise<RegistryProjectPageData | null> {
  const normalizedProjectId = normalizeId(`${authorId}/${projectName}`);
  const authorsIndexRaw = await safeFetchText(getRegistryAuthorsIndexPath());
  const authorsIndex = safeJson<RawAuthorsIndex>(authorsIndexRaw ?? "{}", {});
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
      items.filter((item) => normalizeId(item.projectId ?? "") === normalizedProjectId),
    ]),
  );
  const hasAssets = Object.values(itemsByType).some((items) => items.length > 0);
  const assetCount = Object.values(itemsByType).reduce((count, items) => count + items.length, 0);

  if (!hasAssets || assetCount <= 1) {
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
  const itemProjectByTypeAndId = buildItemProjectLookup(allItemsByType);
  const projectAssetCounts = buildProjectAssetCounts(allItemsByType);
  const downloads = getProjectTotals(itemsByType);
  const analytics: RegistryAuthorAnalytics = {
    downloads,
    ranks: computeProjectDownloadRanks(normalizedProjectId, allItemsByType),
    history: computeProjectHistory(normalizedProjectId, dailyRows, itemProjectByTypeAndId),
    trends: computeProjectTrends(
      normalizedProjectId,
      dailyRows,
      itemProjectByTypeAndId,
      projectAssetCounts,
    ),
    rankingsByType: Object.fromEntries(
      REGISTRY_TYPES.map((typeConfig) => [
        typeConfig.id,
        computeRankingRows(itemsByType[typeConfig.id] ?? [], allItemsByType[typeConfig.id] ?? []),
      ]),
    ),
  };
  const [projectAuthorId = authorId] = normalizedProjectId.split("/");

  return {
    project: {
      projectId: normalizedProjectId,
      projectName: getProjectName(normalizedProjectId),
      authorId: projectAuthorId,
      authorLabel: resolveAuthorLabel(projectAuthorId, authorsIndex),
      githubUrl: `https://github.com/${normalizedProjectId}`,
    },
    itemsByType,
    collaborations: [],
    contributorsByItemKey: buildContributorsByItemKey(itemsByType, authorsIndex),
    overview: computeProjectOverview(itemsByType, releaseCache),
    analytics,
  };
}
