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
  cumulativeDownloads: {
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
  authorId: string;
  authorName: string;
  authorHref: string;
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
  searchAliases: string[];
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
  searchAliases: string[];
  countryCode: string;
  countryName: string;
  cityCode: string;
  downloads: number;
};

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

function getDateHeaders(rows: CsvRow[]): string[] {
  return Object.keys(rows[0] ?? {}).filter((header) => /^\d{4}_\d{2}_\d{2}$/.test(header));
}

function getAssetType(value: string | undefined): RegistryAnalyticsAssetTypeId | null {
  if (value === "map" || value === "maps") return "maps";
  if (value === "mod" || value === "mods") return "mods";
  return null;
}

type RegistryAnalyticsItem = Awaited<ReturnType<typeof loadRegistryItemsForType>>[number];

function buildValidItemsById(items: RegistryAnalyticsItem[]): Map<string, RegistryAnalyticsItem> {
  return new Map(items.map((item) => [item.id, item]));
}

function getPublishedDate(item: RegistryAnalyticsItem): string | null {
  const timestamp = item.publishedAt ?? 0;
  if (timestamp <= 0) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getFirstActivityDate(row: CsvRow, dateHeaders: string[]): string | null {
  for (const dateHeader of dateHeaders) {
    if (getNumber(row[dateHeader]) > 0) {
      return normalizeDate(dateHeader);
    }
  }

  return null;
}

function setEarliestAuthorDate(
  authorDates: Map<string, string>,
  authorId: string | undefined,
  date: string | null,
) {
  const normalizedAuthorId = authorId?.trim().toLowerCase();
  if (!normalizedAuthorId || !date) return;

  const currentDate = authorDates.get(normalizedAuthorId);
  if (!currentDate || date < currentDate) {
    authorDates.set(normalizedAuthorId, date);
  }
}

function normalizeHistory(
  rows: CsvRow[],
  items: RegistryAnalyticsItem[],
): RegistryAnalyticsHistoryPoint[] {
  const dateHeaders = getDateHeaders(rows);
  const validItemsById = buildValidItemsById(items);
  const downloadsByDate = new Map<
    string,
    Pick<RegistryAnalyticsHistoryPoint, "downloads" | "listings">
  >();

  for (const dateHeader of dateHeaders) {
    downloadsByDate.set(normalizeDate(dateHeader), {
      downloads: { total: 0, maps: 0, mods: 0 },
      listings: { total: 0, maps: 0, mods: 0 },
    });
  }

  for (const item of items) {
    const publishedDate = getPublishedDate(item);
    const day = publishedDate ? downloadsByDate.get(publishedDate) : undefined;
    if (!day) continue;

    const typeKey = item.type === "maps" ? "maps" : "mods";
    day.listings.total += 1;
    day.listings[typeKey] += 1;
  }

  for (const row of rows) {
    const item = validItemsById.get(row.id ?? "");
    if (!item) continue;

    const typeKey = item.type === "maps" ? "maps" : "mods";
    for (const dateHeader of dateHeaders) {
      const date = normalizeDate(dateHeader);
      const day = downloadsByDate.get(date);
      if (!day) continue;

      const downloads = getNumber(row[dateHeader]);
      day.downloads.total += downloads;
      day.downloads[typeKey] += downloads;
    }
  }

  let cumulativeTotal = 0;
  let cumulativeMaps = 0;
  let cumulativeMods = 0;

  return [...downloadsByDate.entries()]
    .map(([date, day]) => {
      cumulativeTotal += day.downloads.total;
      cumulativeMaps += day.downloads.maps;
      cumulativeMods += day.downloads.mods;

      return {
        date,
        downloads: day.downloads,
        cumulativeDownloads: {
          total: cumulativeTotal,
          maps: cumulativeMaps,
          mods: cumulativeMods,
        },
        listings: day.listings,
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function buildAuthorHistory(
  rows: CsvRow[],
  items: RegistryAnalyticsItem[],
): RegistryAnalyticsAuthorHistoryPoint[] {
  const dateHeaders = getDateHeaders(rows);
  const firstPublishedDateByAuthor = new Map<string, string>();

  for (const item of items) {
    setEarliestAuthorDate(
      firstPublishedDateByAuthor,
      item.authorId ?? undefined,
      getPublishedDate(item),
    );
  }

  for (const row of rows) {
    setEarliestAuthorDate(
      firstPublishedDateByAuthor,
      row.author,
      getFirstActivityDate(row, dateHeaders),
    );
  }

  return dateHeaders.map((dateKey) => {
    const date = normalizeDate(dateKey);

    return {
      date,
      authors: [...firstPublishedDateByAuthor.values()].filter(
        (publishedDate) => publishedDate <= date,
      ).length,
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
      authorId: project.authorId,
      authorName: project.authorLabel,
      authorHref: project.authorHref,
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
  validItemsById: Map<string, RegistryAnalyticsItem>,
): RegistryAnalyticsMapStatisticRanking[] {
  return rows
    .filter((row) => validItemsById.has(row.id ?? ""))
    .map((row) => {
      const item = validItemsById.get(row.id ?? "");
      return {
        id: row.id ?? "",
        name: row.name?.trim() || item?.name || row.id || "Unknown map",
        authorId: row.author?.trim() || item?.authorId || "",
        authorName:
          row.author_alias?.trim() || item?.author || row.author?.trim() || "Unknown author",
        searchAliases: item?.searchAliases ?? [],
        countryCode: row.country?.trim().toUpperCase() || item?.countryCode || "",
        cityCode: row.city_code?.trim().toUpperCase() || item?.cityCode || "",
        demand: getNumber(row.population),
        pops: getNumber(row.population_count),
        demandPoints: getNumber(row.points_count),
        playableAreaKm2: playableAreaByMapId.get(row.id ?? "") ?? 0,
      };
    })
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
  validItemsById: Map<string, RegistryAnalyticsItem>,
): Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]> {
  const grouped: Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]> = {
    maps: [],
    mods: [],
  };

  for (const row of rows) {
    const item = validItemsById.get(row.id ?? "");
    if (!item) continue;
    const type = getAssetType(row.listing_type);
    if (!type) continue;
    grouped[type].push({
      id: row.id ?? "",
      type,
      name: row.name?.trim() || item.name || row.id || "Unknown asset",
      authorId: row.author?.trim() || item.authorId || "",
      authorName: row.author_alias?.trim() || item.author || row.author?.trim() || "Unknown author",
      searchAliases: item.searchAliases ?? [],
      countryCode: item.countryCode ?? "",
      countryName: item.countryName ?? "",
      cityCode: item.cityCode ?? "",
      downloads: getDownloads(row),
    });
  }

  return {
    maps: grouped.maps.sort((left, right) => right.downloads - left.downloads),
    mods: grouped.mods.sort((left, right) => right.downloads - left.downloads),
  };
}

function buildFourteenDayRankings(
  rows: CsvRow[],
  validItemsById: Map<string, RegistryAnalyticsItem>,
) {
  const dateHeaders = getDateHeaders(rows).slice(-14);
  return normalizeRankingRows(
    rows,
    (row) => dateHeaders.reduce((sum, dateKey) => sum + getNumber(row[dateKey]), 0),
    validItemsById,
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
    authorDayRaw,
    mapStatisticsRaw,
    byDayRaw,
    creatorData,
    itemEntries,
    allTimeRaw,
    last3Raw,
    last7Raw,
  ] = await Promise.all([
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

  const authorRows = parseCsv(authorDayRaw);
  const mapStatisticRows = parseCsv(mapStatisticsRaw);
  const byDayRows = parseCsv(byDayRaw);
  const allItems = itemEntries.flat();
  const validItemsById = buildValidItemsById(allItems);
  const contentRankings = buildEmptyContentRankings();
  contentRankings["all-time"] = normalizeRankingRows(
    parseCsv(allTimeRaw),
    (row) => getNumber(row.adjusted_total_downloads || row.total_downloads),
    validItemsById,
  );
  contentRankings["3d"] = normalizeRankingRows(
    parseCsv(last3Raw),
    (row) => getNumber(row.adjusted_download_change || row.download_change),
    validItemsById,
  );
  contentRankings["7d"] = normalizeRankingRows(
    parseCsv(last7Raw),
    (row) => getNumber(row.adjusted_download_change || row.download_change),
    validItemsById,
  );
  contentRankings["14d"] = buildFourteenDayRankings(byDayRows, validItemsById);
  const history = normalizeHistory(byDayRows, allItems);
  const maps = allItems.filter((item) => item.type === "maps");
  const mods = allItems.filter((item) => item.type === "mods");
  const validMapIds = new Set(maps.map((item) => item.id));
  const playableAreaByMapId = buildMapPlayableAreaLookup(maps);
  const mapDownloads = maps.reduce((sum, item) => sum + item.totalDownloads, 0);
  const modDownloads = mods.reduce((sum, item) => sum + item.totalDownloads, 0);

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
      history: buildAuthorHistory(authorRows, allItems),
      rankings: buildAuthorRankings(creatorData.authors),
    },
    projects: {
      rankings: buildProjectRankings(creatorData.projects),
    },
    mapStatistics: {
      rankings: buildMapStatisticRankings(
        mapStatisticRows,
        playableAreaByMapId,
        new Map([...validItemsById].filter(([id]) => validMapIds.has(id))),
      ),
    },
  };
}
