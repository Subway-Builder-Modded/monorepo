import { loadCreatorDatabaseData } from "@/features/registry/authors/lib/load-creator-database";
import { buildRegistryCountrySearchValues } from "@/features/registry/lib/registry-search";
import { ADMIN_AUTHOR_ID } from "@/features/registry/lib/credited-downloads";
import {
  buildAuthorDailyDownloadSeries,
  buildListingCreditWindows,
  resolveCreditedPersonIdForDate,
} from "@/features/registry/lib/daily-credit-attribution";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";

export type RegistryAnalyticsPeriodId = "all-time" | "1d" | "3d" | "7d" | "14d" | "30d";
export type RegistryAnalyticsAssetTypeId = "maps" | "mods";

/** Periods whose downloads chart derives from the hourly series (4h buckets). */
export const HOURLY_CHART_PERIODS: ReadonlySet<RegistryAnalyticsPeriodId> = new Set(["1d", "3d"]);
/** Display grouping of the hourly series: wall-clock-aligned 4h windows (UTC). */
export const HOURLY_BUCKET_HOURS = 4;

export type RegistryAnalyticsHourlyPoint = {
  /** UTC hour bucket key, e.g. "2026-08-13T04:00Z". */
  bucket: string;
  downloads: {
    total: number;
    maps: number;
    mods: number;
  };
};

/**
 * Per-entity analogue of RegistryAnalyticsEntityDailySeries at hour grain.
 * Entities carry values only — name/color/search metadata stays on the daily
 * series and joins by id at render time.
 */
export type RegistryAnalyticsEntityHourlySeries = {
  /** Ascending UTC hour bucket universe of the rolling window. */
  buckets: string[];
  entities: Array<{
    id: string;
    byBucket: Map<string, { maps: number; mods: number }>;
  }>;
};

/** Floors an hour bucket key to its wall-clock-aligned display window. */
export function alignHourlyBucket(bucket: string, bucketHours = HOURLY_BUCKET_HOURS): string {
  const hour = Number.parseInt(bucket.slice(11, 13), 10);
  if (!Number.isFinite(hour)) return bucket;
  const alignedHour = Math.floor(hour / bucketHours) * bucketHours;
  return `${bucket.slice(0, 11)}${String(alignedHour).padStart(2, "0")}:00Z`;
}

/**
 * The aligned display-window bucket keys for a short period: unique, ascending,
 * trailing 24h/72h of the series (the newest window is partial until its last
 * hour lands).
 */
export function getHourlyWindowBuckets(
  buckets: Iterable<string>,
  period: RegistryAnalyticsPeriodId,
): string[] {
  const aligned = [...new Set([...buckets].map((bucket) => alignHourlyBucket(bucket)))].sort(
    (left, right) => left.localeCompare(right),
  );
  const windowHours = period === "1d" ? 24 : 72;
  return aligned.slice(-(windowHours / HOURLY_BUCKET_HOURS));
}

/** Chart x label for an aligned bucket: "04:00" within a one-day cut, "08-11 04:00" across days. */
export function formatHourlyBucketLabel(bucket: string, period: RegistryAnalyticsPeriodId): string {
  const time = bucket.slice(11, 16);
  return period === "1d" ? time : `${bucket.slice(5, 10)} ${time}`;
}

/** Sparse ticks for hourly-derived charts: every point at 1d, day boundaries at 3d. */
export function getHourlyChartTicks(
  labels: string[],
  period: RegistryAnalyticsPeriodId,
): string[] {
  return period === "1d" ? labels : labels.filter((label) => label.endsWith("00:00"));
}

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
  /** Listings deprecated on this date (manifest deprecation.since). */
  deprecations: {
    total: number;
    maps: number;
    mods: number;
  };
};

export type RegistryAnalyticsAuthorHistoryPoint = {
  date: string;
  authors: number;
};

export type RegistryAnalyticsEntityDailySeries = {
  /** Ascending date universe (YYYY-MM-DD) of the daily analytics window. */
  dates: string[];
  /** One daily series per charted entity (author, listing, project, ...). */
  entities: Array<{
    id: string;
    name: string;
    byDate: Map<string, { maps: number; mods: number }>;
    /** Fixed color for synthetic categories (e.g. "No Project"); palette otherwise. */
    color?: string;
    /** Synthetic catch-all categories don't count toward the series-count floor. */
    synthetic?: boolean;
    /** Vocabulary for filter-by-search, mirroring the tab's rankings search. */
    searchValues?: string[];
  }>;
};

export type RegistryAnalyticsAuthorRanking = {
  id: string;
  name: string;
  href: string;
  downloads: number;
  /** Assets this person authors (their own listings). */
  authored: number;
  /** Assets where this person is a plain collaborator (caretaken excluded). */
  collaborator: number;
  /** Assets this person caretakes. */
  caretaker: number;
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
  /** Site-wide hourly download deltas (14-day rolling window, UTC buckets, ascending). */
  hourly: RegistryAnalyticsHourlyPoint[];
  contentRankings: Record<
    RegistryAnalyticsPeriodId,
    Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]>
  >;
  authors: {
    history: RegistryAnalyticsAuthorHistoryPoint[];
    rankings: RegistryAnalyticsAuthorRanking[];
    /** Per-author (day-grain credit-attributed, admin excluded). */
    dailyDownloads: RegistryAnalyticsEntityDailySeries;
    hourlyDownloads: RegistryAnalyticsEntityHourlySeries;
  };
  listings: {
    /** Per-listing. */
    dailyDownloads: RegistryAnalyticsEntityDailySeries;
    hourlyDownloads: RegistryAnalyticsEntityHourlySeries;
  };
  countries: {
    /** Per-country, aggregated over the country's listings (country-less listings excluded). */
    dailyDownloads: RegistryAnalyticsEntityDailySeries;
    hourlyDownloads: RegistryAnalyticsEntityHourlySeries;
  };
  regions: {
    /** Per registry location tag (manifest `location`, derived from country). */
    dailyDownloads: RegistryAnalyticsEntityDailySeries;
    hourlyDownloads: RegistryAnalyticsEntityHourlySeries;
  };
  projects: {
    rankings: RegistryAnalyticsProjectRanking[];
    /** Per-project (multi-asset projects only, matching the rankings). */
    dailyDownloads: RegistryAnalyticsEntityDailySeries;
    hourlyDownloads: RegistryAnalyticsEntityHourlySeries;
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
const HOURLY_DOWNLOADS_URL = "/registry-cache/analytics/hourly/downloads.csv";
const RANKING_URLS = {
  "all-time": "/registry-cache/analytics/most_popular_all_time.csv",
  "1d": "/registry-cache/analytics/most_popular_last_1d.csv",
  "3d": "/registry-cache/analytics/most_popular_last_3d.csv",
  "7d": "/registry-cache/analytics/most_popular_last_7d.csv",
  "30d": "/registry-cache/analytics/most_popular_last_30d.csv",
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

function getDeprecationDate(item: RegistryAnalyticsItem): string | null {
  const manifest = item.manifest as { deprecation?: { since?: string } };
  const since = manifest?.deprecation?.since;
  if (typeof since !== "string") return null;
  const date = since.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
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
    Pick<RegistryAnalyticsHistoryPoint, "downloads" | "listings" | "deprecations">
  >();

  for (const dateHeader of dateHeaders) {
    downloadsByDate.set(normalizeDate(dateHeader), {
      downloads: { total: 0, maps: 0, mods: 0 },
      listings: { total: 0, maps: 0, mods: 0 },
      deprecations: { total: 0, maps: 0, mods: 0 },
    });
  }

  for (const item of items) {
    const typeKey = item.type === "maps" ? "maps" : "mods";
    const publishedDate = getPublishedDate(item);
    const day = publishedDate ? downloadsByDate.get(publishedDate) : undefined;
    if (day) {
      day.listings.total += 1;
      day.listings[typeKey] += 1;
    }

    const deprecationDate = getDeprecationDate(item);
    const deprecationDay = deprecationDate ? downloadsByDate.get(deprecationDate) : undefined;
    if (deprecationDay) {
      deprecationDay.deprecations.total += 1;
      deprecationDay.deprecations[typeKey] += 1;
    }
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
        deprecations: day.deprecations,
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

/** One daily series per listing, straight from the by-day rows (no attribution). */
function buildListingDailySeries(
  rows: CsvRow[],
  validItemsById: Map<string, RegistryAnalyticsItem>,
): RegistryAnalyticsEntityDailySeries {
  const dateHeaders = getDateHeaders(rows);
  const dates = dateHeaders.map(normalizeDate).sort((left, right) => left.localeCompare(right));
  const entities: RegistryAnalyticsEntityDailySeries["entities"] = [];

  for (const row of rows) {
    const item = validItemsById.get(row.id ?? "");
    if (!item) continue;
    const isMap = item.type === "maps";
    const byDate = new Map<string, { maps: number; mods: number }>();
    for (const dateHeader of dateHeaders) {
      const downloads = getNumber(row[dateHeader]);
      if (downloads <= 0) continue;
      byDate.set(normalizeDate(dateHeader), {
        maps: isMap ? downloads : 0,
        mods: isMap ? 0 : downloads,
      });
    }
    if (byDate.size > 0) {
      entities.push({
        id: item.id,
        name: row.name?.trim() || item.name || item.id,
        byDate,
        searchValues: [
          item.name,
          item.id,
          item.author ?? "",
          item.authorId ?? "",
          item.countryCode ?? "",
          item.countryName ?? "",
          ...buildRegistryCountrySearchValues(item.countryCode ?? ""),
          ...(item.searchAliases ?? []),
        ],
      });
    }
  }

  return { dates, entities };
}

/**
 * One daily series per country, aggregated over that country's listings.
 * Listings without a country (mods today; any future country-less asset type)
 * are excluded rather than bucketed, so the chart stays a geography view.
 */
function buildCountryDailySeries(
  rows: CsvRow[],
  validItemsById: Map<string, RegistryAnalyticsItem>,
): RegistryAnalyticsEntityDailySeries {
  const dateHeaders = getDateHeaders(rows);
  const dates = dateHeaders.map(normalizeDate).sort((left, right) => left.localeCompare(right));
  const entitiesById = new Map<string, RegistryAnalyticsEntityDailySeries["entities"][number]>();

  for (const row of rows) {
    const item = validItemsById.get(row.id ?? "");
    const countryCode = item?.countryCode?.trim().toUpperCase();
    if (!item || !countryCode) continue;
    const isMap = item.type === "maps";

    const entity = entitiesById.get(countryCode) ?? {
      id: countryCode,
      name: item.countryName?.trim() || countryCode,
      byDate: new Map<string, { maps: number; mods: number }>(),
      searchValues: [
        item.countryName ?? "",
        countryCode,
        ...buildRegistryCountrySearchValues(countryCode),
      ],
    };
    for (const dateHeader of dateHeaders) {
      const downloads = getNumber(row[dateHeader]);
      if (downloads <= 0) continue;
      const date = normalizeDate(dateHeader);
      const current = entity.byDate.get(date) ?? { maps: 0, mods: 0 };
      if (isMap) current.maps += downloads;
      else current.mods += downloads;
      entity.byDate.set(date, current);
    }
    entitiesById.set(countryCode, entity);
  }

  return { dates, entities: [...entitiesById.values()] };
}

/** "north-america" -> "North America", "very-high" -> "Very High". */
function titleCaseSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type EntityGroup = { id: string; name: string; color?: string };

/** Generic daily-series builder grouping listings by an item-derived key. */
function buildGroupedDailySeries(
  rows: CsvRow[],
  validItemsById: Map<string, RegistryAnalyticsItem>,
  getGroup: (item: RegistryAnalyticsItem) => EntityGroup | null,
): RegistryAnalyticsEntityDailySeries {
  const dateHeaders = getDateHeaders(rows);
  const dates = dateHeaders.map(normalizeDate).sort((left, right) => left.localeCompare(right));
  const entitiesById = new Map<string, RegistryAnalyticsEntityDailySeries["entities"][number]>();

  for (const row of rows) {
    const item = validItemsById.get(row.id ?? "");
    if (!item) continue;
    const group = getGroup(item);
    if (!group) continue;
    const isMap = item.type === "maps";

    const entity = entitiesById.get(group.id) ?? {
      id: group.id,
      name: group.name,
      byDate: new Map<string, { maps: number; mods: number }>(),
      ...(group.color ? { color: group.color } : {}),
    };
    for (const dateHeader of dateHeaders) {
      const downloads = getNumber(row[dateHeader]);
      if (downloads <= 0) continue;
      const date = normalizeDate(dateHeader);
      const current = entity.byDate.get(date) ?? { maps: 0, mods: 0 };
      if (isMap) current.maps += downloads;
      else current.mods += downloads;
      entity.byDate.set(date, current);
    }
    entitiesById.set(group.id, entity);
  }

  return { dates, entities: [...entitiesById.values()] };
}

function getItemLocation(item: RegistryAnalyticsItem): string {
  const manifest = item.manifest as { location?: string };
  return manifest.location?.trim().toLowerCase() ?? "";
}

/** Distinct slate for the synthetic "No Project" series (Others stays lighter grey). */
const NO_PROJECT_SERIES_COLOR = "#64748b";
const NO_PROJECT_SERIES_ID = "__no_project__";

/**
 * One daily series per project, aggregated over the project's listings.
 * Projects match the tab's definition (multi-asset); every listing outside
 * one — including single-asset repos — rolls into a synthetic "No Project"
 * series so the chart still accounts for the whole registry.
 */
function buildProjectDailySeries(
  rows: CsvRow[],
  validItemsById: Map<string, RegistryAnalyticsItem>,
  projectMetaById: Map<string, { name: string; searchValues: string[] }>,
): RegistryAnalyticsEntityDailySeries {
  const dateHeaders = getDateHeaders(rows);
  const dates = dateHeaders.map(normalizeDate).sort((left, right) => left.localeCompare(right));
  const entitiesById = new Map<string, RegistryAnalyticsEntityDailySeries["entities"][number]>();

  for (const row of rows) {
    const item = validItemsById.get(row.id ?? "");
    if (!item) continue;
    const projectId = item.projectId?.trim().toLowerCase();
    const projectMeta = projectId ? projectMetaById.get(projectId) : undefined;
    const isProjectListing = Boolean(projectId && projectMeta);
    const isMap = item.type === "maps";

    const entity = entitiesById.get(isProjectListing ? projectId! : NO_PROJECT_SERIES_ID) ?? {
      id: isProjectListing ? projectId! : NO_PROJECT_SERIES_ID,
      name: isProjectListing ? projectMeta!.name : "No Project",
      byDate: new Map<string, { maps: number; mods: number }>(),
      ...(isProjectListing
        ? { searchValues: projectMeta!.searchValues }
        : { color: NO_PROJECT_SERIES_COLOR, synthetic: true, searchValues: ["No Project"] }),
    };
    for (const dateHeader of dateHeaders) {
      const downloads = getNumber(row[dateHeader]);
      if (downloads <= 0) continue;
      const date = normalizeDate(dateHeader);
      const current = entity.byDate.get(date) ?? { maps: 0, mods: 0 };
      if (isMap) current.maps += downloads;
      else current.mods += downloads;
      entity.byDate.set(date, current);
    }
    entitiesById.set(entity.id, entity);
  }

  return { dates, entities: [...entitiesById.values()] };
}

function buildAuthorRankings(
  authors: Awaited<ReturnType<typeof loadCreatorDatabaseData>>["authors"],
): RegistryAnalyticsAuthorRanking[] {
  return authors
    .filter((author) => author.downloads > 0)
    .map((author) => ({
      id: author.id,
      name: author.label,
      href: author.href,
      downloads: author.downloads,
      authored: author.assets,
      collaborator: author.collaborations,
      caretaker: author.caretakenAssets,
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
    "1d": { maps: [], mods: [] },
    "3d": { maps: [], mods: [] },
    "7d": { maps: [], mods: [] },
    "14d": { maps: [], mods: [] },
    "30d": { maps: [], mods: [] },
  };
}

/**
 * Aggregates the long-form hourly CSV (bucket_utc,listing_type,id,downloads)
 * into site-wide per-bucket totals, ascending (bucket keys sort chronologically).
 */
function normalizeHourly(rows: CsvRow[]): RegistryAnalyticsHourlyPoint[] {
  const byBucket = new Map<string, { total: number; maps: number; mods: number }>();
  for (const row of rows) {
    const bucket = row.bucket_utc ?? "";
    const type = getAssetType(row.listing_type);
    const downloads = getNumber(row.downloads);
    if (!bucket || !type || downloads <= 0) continue;
    const entry = byBucket.get(bucket) ?? { total: 0, maps: 0, mods: 0 };
    entry.total += downloads;
    entry[type] += downloads;
    byBucket.set(bucket, entry);
  }
  return [...byBucket.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, downloads]) => ({ bucket, downloads }));
}

/**
 * Folds the long-form hourly rows into per-entity hour-grain series using the
 * same listing→entity assignment its daily sibling uses (the bucket's UTC date
 * feeds date-sensitive assignments like caretaker credit windows).
 */
function buildEntityHourlySeries(
  hourlyRows: CsvRow[],
  assignEntityId: (
    typeId: RegistryAnalyticsAssetTypeId,
    listingId: string,
    bucketDateTs: number,
  ) => string | null,
): RegistryAnalyticsEntityHourlySeries {
  const buckets = new Set<string>();
  const entitiesById = new Map<string, RegistryAnalyticsEntityHourlySeries["entities"][number]>();
  for (const row of hourlyRows) {
    const type = getAssetType(row.listing_type);
    const bucket = row.bucket_utc ?? "";
    const downloads = getNumber(row.downloads);
    if (!type || !bucket || downloads <= 0) continue;
    buckets.add(bucket);
    const entityId = assignEntityId(type, row.id ?? "", Date.parse(bucket.slice(0, 10)));
    if (!entityId) continue;
    const entity = entitiesById.get(entityId) ?? { id: entityId, byBucket: new Map() };
    const current = entity.byBucket.get(bucket) ?? { maps: 0, mods: 0 };
    current[type] += downloads;
    entity.byBucket.set(bucket, current);
    entitiesById.set(entityId, entity);
  }
  return {
    buckets: [...buckets].sort((left, right) => left.localeCompare(right)),
    entities: [...entitiesById.values()],
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

/**
 * Groups hourly points into wall-clock-aligned `bucketHours` windows (UTC),
 * ascending; each grouped point keeps the window's START hour as its bucket key.
 * Alignment to 00/04/08/... keeps windows comparable day-over-day; the trailing
 * window is partial until its last hour lands.
 */
export function bucketRegistryAnalyticsHourly(
  hourly: RegistryAnalyticsHourlyPoint[],
  bucketHours = 4,
): RegistryAnalyticsHourlyPoint[] {
  const byBucket = new Map<string, RegistryAnalyticsHourlyPoint["downloads"]>();
  for (const point of hourly) {
    const hour = Number.parseInt(point.bucket.slice(11, 13), 10);
    if (!Number.isFinite(hour)) continue;
    const alignedHour = Math.floor(hour / bucketHours) * bucketHours;
    const aligned = `${point.bucket.slice(0, 11)}${String(alignedHour).padStart(2, "0")}:00Z`;
    const entry = byBucket.get(aligned) ?? { total: 0, maps: 0, mods: 0 };
    entry.total += point.downloads.total;
    entry.maps += point.downloads.maps;
    entry.mods += point.downloads.mods;
    byBucket.set(aligned, entry);
  }
  return [...byBucket.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, downloads]) => ({ bucket, downloads }));
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
    hourlyRaw,
    creatorData,
    itemEntries,
    allTimeRaw,
    last1Raw,
    last3Raw,
    last7Raw,
    last30Raw,
  ] = await Promise.all([
    safeFetchText(AUTHORS_BY_DAY_URL),
    safeFetchText(MAP_STATISTICS_URL),
    safeFetchText(MOST_POPULAR_BY_DAY_URL),
    safeFetchText(HOURLY_DOWNLOADS_URL),
    loadCreatorDatabaseData(),
    Promise.all(
      REGISTRY_TYPES.map((typeConfig) =>
        loadRegistryItemsForType(typeConfig.id, typeConfig.routeSegment),
      ),
    ),
    safeFetchText(RANKING_URLS["all-time"]),
    safeFetchText(RANKING_URLS["1d"]),
    safeFetchText(RANKING_URLS["3d"]),
    safeFetchText(RANKING_URLS["7d"]),
    safeFetchText(RANKING_URLS["30d"]),
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
  contentRankings["1d"] = normalizeRankingRows(
    parseCsv(last1Raw),
    (row) => getNumber(row.adjusted_download_change || row.download_change),
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
  contentRankings["30d"] = normalizeRankingRows(
    parseCsv(last30Raw),
    (row) => getNumber(row.adjusted_download_change || row.download_change),
    validItemsById,
  );
  const history = normalizeHistory(byDayRows, allItems);
  const itemsByTypeRecord = Object.fromEntries(
    REGISTRY_TYPES.map((typeConfig, index) => [typeConfig.id, itemEntries[index] ?? []]),
  );
  const authorLoginByGithubId = new Map<number, string>();
  for (const author of creatorData.authors) {
    if (typeof author.githubId === "number") {
      authorLoginByGithubId.set(author.githubId, author.id);
    }
  }
  const creditWindowsByListing = buildListingCreditWindows(itemsByTypeRecord, authorLoginByGithubId);
  const authorDaily = buildAuthorDailyDownloadSeries({
    dailyRows: byDayRows,
    items: allItems,
    creditWindowsByListing,
    excludedPersonIds: [ADMIN_AUTHOR_ID],
  });
  // Per-entity hourly series mirror the daily builders' listing→entity
  // assignments (credit windows for authors, country/region/project mappings)
  // so 1d/3d entity charts can draw real sub-daily shapes.
  const hourlyRows = parseCsv(hourlyRaw);
  const listingsHourly = buildEntityHourlySeries(hourlyRows, (_typeId, listingId) =>
    validItemsById.has(listingId) ? listingId : null,
  );
  const countriesHourly = buildEntityHourlySeries(hourlyRows, (_typeId, listingId) => {
    const item = validItemsById.get(listingId);
    const countryCode = item?.countryCode?.trim().toUpperCase();
    return item && countryCode ? countryCode : null;
  });
  const regionsHourly = buildEntityHourlySeries(hourlyRows, (_typeId, listingId) => {
    const item = validItemsById.get(listingId);
    return item ? getItemLocation(item) || null : null;
  });
  const adminPersonId = ADMIN_AUTHOR_ID.trim().toLowerCase();
  const authorsHourly = buildEntityHourlySeries(hourlyRows, (_typeId, listingId, bucketDateTs) => {
    const item = validItemsById.get(listingId);
    const listingAuthorId = (item?.authorId ?? item?.author ?? "").trim().toLowerCase();
    if (!item || !listingAuthorId) return null;
    const creditedId = resolveCreditedPersonIdForDate(
      bucketDateTs,
      creditWindowsByListing.get(`${item.type}:${listingId}`),
      listingAuthorId,
    );
    return creditedId && creditedId !== adminPersonId ? creditedId : null;
  });
  const authorLabelById = new Map(
    creatorData.authors.map((author) => [author.id.trim().toLowerCase(), author.label]),
  );
  const authorDailyDownloads: RegistryAnalyticsEntityDailySeries = {
    dates: authorDaily.dates,
    entities: authorDaily.authors.map((series) => ({
      id: series.id,
      name: authorLabelById.get(series.id) ?? series.id,
      byDate: series.byDate,
    })),
  };
  const projectMetaById = new Map(
    creatorData.projects.map((project) => [
      project.id.trim().toLowerCase(),
      {
        name: project.name,
        searchValues: [project.name, project.id, project.authorLabel, project.authorId],
      },
    ]),
  );
  const projectsHourly = buildEntityHourlySeries(hourlyRows, (_typeId, listingId) => {
    const item = validItemsById.get(listingId);
    if (!item) return null;
    const projectId = item.projectId?.trim().toLowerCase();
    return projectId && projectMetaById.has(projectId) ? projectId : NO_PROJECT_SERIES_ID;
  });
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
    hourly: normalizeHourly(hourlyRows),
    contentRankings,
    authors: {
      history: buildAuthorHistory(authorRows, allItems),
      rankings: buildAuthorRankings(creatorData.authors),
      dailyDownloads: authorDailyDownloads,
      hourlyDownloads: authorsHourly,
    },
    listings: {
      dailyDownloads: buildListingDailySeries(byDayRows, validItemsById),
      hourlyDownloads: listingsHourly,
    },
    countries: {
      dailyDownloads: buildCountryDailySeries(byDayRows, validItemsById),
      hourlyDownloads: countriesHourly,
    },
    regions: {
      dailyDownloads: buildGroupedDailySeries(byDayRows, validItemsById, (item) => {
        const location = getItemLocation(item);
        return location ? { id: location, name: titleCaseSlug(location) } : null;
      }),
      hourlyDownloads: regionsHourly,
    },
    projects: {
      rankings: buildProjectRankings(creatorData.projects),
      dailyDownloads: buildProjectDailySeries(byDayRows, validItemsById, projectMetaById),
      hourlyDownloads: projectsHourly,
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
