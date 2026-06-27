import { loadCreatorDatabaseData } from "@/features/registry/authors/lib/load-creator-database";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";

export type RegistryAnalyticsPeriodId = "all-time" | "3d" | "7d" | "14d";
export type RegistryAnalyticsAssetTypeId = "maps" | "mods";

export type RegistryAnalyticsHistoryPoint = {
  date: string;
  downloads: {
    total: number;
    maps: number;
    mods: number;
  };
  listings: {
    total: number;
    maps: number;
    mods: number;
  };
};

export type RegistryAnalyticsAuthorHistoryPoint = {
  date: string;
  authors: number;
};

export type RegistryAnalyticsAuthorRanking = {
  id: string;
  name: string;
  href: string;
  downloads: number;
  maps: number;
  mods: number;
  assets: number;
};

export type RegistryAnalyticsProjectRanking = {
  id: string;
  name: string;
  href: string;
  downloads: number;
  maps: number;
  mods: number;
  assets: number;
};

export type RegistryAnalyticsMapStatisticRanking = {
  id: string;
  name: string;
  authorId: string;
  authorName: string;
  countryCode: string;
  cityCode: string;
  demand: number;
  pops: number;
  demandPoints: number;
  playableAreaKm2: number;
};

export type RegistryAnalyticsData = {
  overview: {
    downloads: number;
    listings: number;
    authors: number;
    maps: {
      listings: number;
      downloads: number;
    };
    mods: {
      listings: number;
      downloads: number;
    };
  };
  history: RegistryAnalyticsHistoryPoint[];
  contentRankings: Record<
    RegistryAnalyticsPeriodId,
    Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]>
  >;
  authors: {
    history: RegistryAnalyticsAuthorHistoryPoint[];
    rankings: RegistryAnalyticsAuthorRanking[];
  };
  projects: {
    rankings: RegistryAnalyticsProjectRanking[];
  };
  mapStatistics: {
    rankings: RegistryAnalyticsMapStatisticRanking[];
  };
};

type CsvRow = Record<string, string>;

export type RegistryAnalyticsContentRanking = {
  id: string;
  type: RegistryAnalyticsAssetTypeId;
  name: string;
  authorId: string;
  authorName: string;
  downloads: number;
};

const ASSETS_BY_DAY_URL = "/registry-cache/analytics/assets_by_day.csv";
const AUTHORS_BY_DAY_URL = "/registry-cache/analytics/authors_by_day.csv";
const MAP_STATISTICS_URL = "/registry-cache/analytics/maps_statistics.csv";
const MOST_POPULAR_BY_DAY_URL = "/registry-cache/analytics/most_popular_by_day.csv";
const RANKING_URLS = {
  "all-time": "/registry-cache/analytics/most_popular_all_time.csv",
  "3d": "/registry-cache/analytics/most_popular_last_3d.csv",
  "7d": "/registry-cache/analytics/most_popular_last_7d.csv",
} as const;

function safeFetchText(url: string): Promise<string> {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function parseCsv(raw: string): CsvRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function getNumber(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: string | undefined): string {
  return (value ?? "").replaceAll("_", "-");
}

function getAssetType(value: string | undefined): RegistryAnalyticsAssetTypeId | null {
  if (value === "map" || value === "maps") return "maps";
  if (value === "mod" || value === "mods") return "mods";
  return null;
}

function normalizeHistory(rows: CsvRow[]): RegistryAnalyticsHistoryPoint[] {
  return rows
    .map((row) => ({
      date: normalizeDate(row.snapshot_date),
      downloads: {
        total: getNumber(row.total_downloads_clamped || row.total_downloads),
        maps: getNumber(row.maps_clamped || row.maps),
        mods: getNumber(row.mods_clamped || row.mods),
      },
      listings: {
        total: getNumber(row.total_new_assets),
        maps: getNumber(row.new_maps),
        mods: getNumber(row.new_mods),
      },
    }))
    .filter((row) => row.date)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function buildAuthorHistory(
  rows: CsvRow[],
  validAuthorIds: Set<string>,
): RegistryAnalyticsAuthorHistoryPoint[] {
  const headers = Object.keys(rows[0] ?? {});
  const dateHeaders = headers.filter((header) => /^\d{4}_\d{2}_\d{2}$/.test(header));
  const cumulativeDownloadsByAuthor = new Map<string, number>();

  return dateHeaders.map((dateKey) => {
    let authors = 0;

    for (const row of rows) {
      const authorId = row.author?.trim().toLowerCase();
      if (!authorId || !validAuthorIds.has(authorId)) continue;
      const nextTotal = (cumulativeDownloadsByAuthor.get(authorId) ?? 0) + getNumber(row[dateKey]);
      cumulativeDownloadsByAuthor.set(authorId, nextTotal);
      if (nextTotal > 0) authors += 1;
    }

    return {
      date: normalizeDate(dateKey),
      authors,
    };
  });
}

function buildAuthorRankings(
  authors: Awaited<ReturnType<typeof loadCreatorDatabaseData>>["authors"],
): RegistryAnalyticsAuthorRanking[] {
  return authors
    .map((author) => ({
      id: author.id,
      name: author.label,
      href: author.href,
      downloads: author.downloads,
      maps: author.maps,
      mods: author.mods,
      assets: author.assets,
    }))
    .sort((left, right) => right.downloads - left.downloads);
}

function buildProjectRankings(
  projects: Awaited<ReturnType<typeof loadCreatorDatabaseData>>["projects"],
): RegistryAnalyticsProjectRanking[] {
  return projects
    .map((project) => ({
      id: project.id,
      name: project.name,
      href: project.href,
      downloads: project.downloads,
      maps: project.maps,
      mods: project.mods,
      assets: project.assets,
    }))
    .sort((left, right) => right.downloads - left.downloads);
}

function getManifestPlayableAreaKm2(manifest: unknown): number | null {
  const value = (manifest as { grid_statistics?: { detail?: { playableAreaKm2?: unknown } } })
    .grid_statistics?.detail?.playableAreaKm2;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildMapPlayableAreaLookup(
  items: Awaited<ReturnType<typeof loadRegistryItemsForType>>,
): Map<string, number> {
  const result = new Map<string, number>();

  for (const item of items) {
    const playableAreaKm2 = getManifestPlayableAreaKm2(item.manifest);
    if (playableAreaKm2 !== null) {
      result.set(item.id, playableAreaKm2);
    }
  }

  return result;
}

function buildMapStatisticRankings(
  rows: CsvRow[],
  playableAreaByMapId: Map<string, number>,
): RegistryAnalyticsMapStatisticRanking[] {
  return rows
    .map((row) => ({
      id: row.id ?? "",
      name: row.name?.trim() || row.id || "Unknown map",
      authorId: row.author?.trim() || "",
      authorName: row.author_alias?.trim() || row.author?.trim() || "Unknown author",
      countryCode: row.country?.trim().toUpperCase() || "",
      cityCode: row.city_code?.trim().toUpperCase() || "",
      demand: getNumber(row.population),
      pops: getNumber(row.population_count),
      demandPoints: getNumber(row.points_count),
      playableAreaKm2: playableAreaByMapId.get(row.id ?? "") ?? 0,
    }))
    .filter((row) => row.id)
    .sort((left, right) => right.demand - left.demand);
}

function buildEmptyContentRankings(): RegistryAnalyticsData["contentRankings"] {
  return {
    "all-time": { maps: [], mods: [] },
    "3d": { maps: [], mods: [] },
    "7d": { maps: [], mods: [] },
    "14d": { maps: [], mods: [] },
  };
}

function normalizeRankingRows(
  rows: CsvRow[],
  getDownloads: (row: CsvRow) => number,
): Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]> {
  const grouped: Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]> = {
    maps: [],
    mods: [],
  };

  for (const row of rows) {
    const type = getAssetType(row.listing_type);
    if (!type) continue;
    grouped[type].push({
      id: row.id ?? "",
      type,
      name: row.name?.trim() || row.id || "Unknown asset",
      authorId: row.author?.trim() || "",
      authorName: row.author_alias?.trim() || row.author?.trim() || "Unknown author",
      downloads: getDownloads(row),
    });
  }

  return {
    maps: grouped.maps.sort((left, right) => right.downloads - left.downloads),
    mods: grouped.mods.sort((left, right) => right.downloads - left.downloads),
  };
}

function buildFourteenDayRankings(rows: CsvRow[]) {
  const headers = Object.keys(rows[0] ?? {});
  const dateHeaders = headers.filter((header) => /^\d{4}_\d{2}_\d{2}$/.test(header)).slice(-14);
  return normalizeRankingRows(rows, (row) =>
    dateHeaders.reduce((sum, dateKey) => sum + getNumber(row[dateKey]), 0),
  );
}

export function filterRegistryAnalyticsHistory(
  history: RegistryAnalyticsHistoryPoint[],
  period: RegistryAnalyticsPeriodId,
) {
  const periodDays = period === "all-time" ? null : Number.parseInt(period, 10);
  if (!periodDays || history.length <= periodDays) return history;
  return history.slice(-periodDays);
}

export function sumRegistryAnalyticsHistory(history: RegistryAnalyticsHistoryPoint[]) {
  return history.reduce(
    (totals, row) => ({
      downloads: {
        total: totals.downloads.total + row.downloads.total,
        maps: totals.downloads.maps + row.downloads.maps,
        mods: totals.downloads.mods + row.downloads.mods,
      },
      listings: {
        total: totals.listings.total + row.listings.total,
        maps: totals.listings.maps + row.listings.maps,
        mods: totals.listings.mods + row.listings.mods,
      },
    }),
    {
      downloads: { total: 0, maps: 0, mods: 0 },
      listings: { total: 0, maps: 0, mods: 0 },
    },
  );
}

export async function loadRegistryAnalyticsData(): Promise<RegistryAnalyticsData> {
  const [
    analyticsRaw,
    authorDayRaw,
    mapStatisticsRaw,
    byDayRaw,
    creatorData,
    itemEntries,
    allTimeRaw,
    last3Raw,
    last7Raw,
  ] = await Promise.all([
    safeFetchText(ASSETS_BY_DAY_URL),
    safeFetchText(AUTHORS_BY_DAY_URL),
    safeFetchText(MAP_STATISTICS_URL),
    safeFetchText(MOST_POPULAR_BY_DAY_URL),
    loadCreatorDatabaseData(),
    Promise.all(
      REGISTRY_TYPES.map((typeConfig) =>
        loadRegistryItemsForType(typeConfig.id, typeConfig.routeSegment),
      ),
    ),
    safeFetchText(RANKING_URLS["all-time"]),
    safeFetchText(RANKING_URLS["3d"]),
    safeFetchText(RANKING_URLS["7d"]),
  ]);

  const rows = parseCsv(analyticsRaw);
  const authorRows = parseCsv(authorDayRaw);
  const mapStatisticRows = parseCsv(mapStatisticsRaw);
  const contentRankings = buildEmptyContentRankings();
  contentRankings["all-time"] = normalizeRankingRows(parseCsv(allTimeRaw), (row) =>
    getNumber(row.adjusted_total_downloads || row.total_downloads),
  );
  contentRankings["3d"] = normalizeRankingRows(parseCsv(last3Raw), (row) =>
    getNumber(row.adjusted_download_change || row.download_change),
  );
  contentRankings["7d"] = normalizeRankingRows(parseCsv(last7Raw), (row) =>
    getNumber(row.adjusted_download_change || row.download_change),
  );
  contentRankings["14d"] = buildFourteenDayRankings(parseCsv(byDayRaw));
  const history = normalizeHistory(rows);
  const allItems = itemEntries.flat();
  const maps = allItems.filter((item) => item.type === "maps");
  const mods = allItems.filter((item) => item.type === "mods");
  const playableAreaByMapId = buildMapPlayableAreaLookup(maps);
  const mapDownloads = maps.reduce((sum, item) => sum + item.totalDownloads, 0);
  const modDownloads = mods.reduce((sum, item) => sum + item.totalDownloads, 0);
  const validAuthorIds = new Set(creatorData.authors.map((author) => author.id.toLowerCase()));

  return {
    overview: {
      downloads: mapDownloads + modDownloads,
      listings: allItems.length,
      authors: creatorData.authors.length,
      maps: {
        listings: maps.length,
        downloads: mapDownloads,
      },
      mods: {
        listings: mods.length,
        downloads: modDownloads,
      },
    },
    history,
    contentRankings,
    authors: {
      history: buildAuthorHistory(authorRows, validAuthorIds),
      rankings: buildAuthorRankings(creatorData.authors),
    },
    projects: {
      rankings: buildProjectRankings(creatorData.projects),
    },
    mapStatistics: {
      rankings: buildMapStatisticRankings(mapStatisticRows, playableAreaByMapId),
    },
  };
}
