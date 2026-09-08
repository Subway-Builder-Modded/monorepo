import { loadCreatorDatabaseData } from "@/features/registry/authors/lib/load-creator-database";
import { buildRegistryCountrySearchValues } from "@/features/registry/lib/registry-search";
import { ADMIN_AUTHOR_ID } from "@/features/registry/lib/credited-downloads";
import {
  buildAuthorDailyDownloadSeries,
  buildListingCreditWindows,
  resolveCreditedPersonIdForDate,
} from "@/features/registry/lib/daily-credit-attribution";
import { loadRegistryItemsForType } from "@/features/registry/lib/load-registry-cache";
import { getRegistryAuthorUrl } from "@/features/registry/lib/routing";
import { REGISTRY_TYPES } from "@/features/registry/registry-type-config";

export type RegistryAnalyticsPeriodId = "all-time" | "1d" | "3d" | "7d" | "14d" | "30d";
export type RegistryAnalyticsAssetTypeId = "maps" | "mods";
/** Scope for the Authors/Projects tabs: everything, or one asset type. */
export type RegistryAnalyticsAssetScopeId = "total" | "maps" | "mods";
/** A measure carried at total grain plus its per-asset-type split. */
export type RegistryAnalyticsScopedValue = Record<RegistryAnalyticsAssetScopeId, number>;

/** Custom date range: closed interval of UTC days, end-inclusive. */
export type RegistryAnalyticsCustomRange = { from: string; to: string };
/** The period URL/prop value: a preset id, or "custom" (range in ?from&to). */
export type RegistryAnalyticsPeriodParam = RegistryAnalyticsPeriodId | "custom";

/**
 * First day with hour-grain data. Before the registry's Cloudflare Worker
 * scheduler, hourly runs were too sparse to trust; the registry's monthly
 * shard series starts here and is never pruned.
 */
export const HOURLY_SERIES_FLOOR_DATE = "2026-07-01";

/** Periods whose downloads chart derives from the hourly series (4h buckets). */
export const HOURLY_CHART_PERIODS: ReadonlySet<RegistryAnalyticsPeriodId> = new Set(["1d", "3d"]);
/** Custom ranges shorter than this many days chart 4h buckets instead of days. */
export const HOURLY_RANGE_MAX_DAYS = 7;
/** Hard cap of x-axis entries for a custom hourly range (6 days x 6 windows). */
const HOURLY_RANGE_MAX_WINDOWS = 36;
/** Display grouping of the hourly series: 4h windows anchored at the newest hour. */
export const HOURLY_BUCKET_HOURS = 4;

const HOUR_MS = 3_600_000;

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

function parseHourBucket(bucket: string): number {
  return Date.parse(`${bucket.slice(0, 11)}${bucket.slice(11, 13)}:00:00Z`);
}

function formatHourBucket(timestamp: number): string {
  return `${new Date(timestamp).toISOString().slice(0, 13)}:00Z`;
}

export type HourlyBucketAligner = (bucket: string) => string;

/**
 * Groups hour buckets into `bucketHours` windows anchored at the NEWEST hour in
 * the data — the hour-grain analogue of how bucketMultiSeriesData anchors its
 * weekly windows. Wall-clock alignment (00/04/08/...) left the trailing window
 * short of up to bucketHours-1 hours, so the newest bar read low for most of
 * its life; anchoring makes it whole and pushes the only partial window to the
 * far edge, which is off-screen for a trailing cut anyway.
 */
export function createHourlyBucketAligner(
  buckets: Iterable<string>,
  bucketHours = HOURLY_BUCKET_HOURS,
): HourlyBucketAligner {
  let latest = Number.NEGATIVE_INFINITY;
  for (const bucket of buckets) {
    const timestamp = parseHourBucket(bucket);
    if (Number.isFinite(timestamp) && timestamp > latest) latest = timestamp;
  }
  if (!Number.isFinite(latest)) return (bucket) => bucket;

  return (bucket) => {
    const timestamp = parseHourBucket(bucket);
    if (!Number.isFinite(timestamp)) return bucket;
    const windowIndex = Math.floor((latest - timestamp) / HOUR_MS / bucketHours);
    return formatHourBucket(latest - ((windowIndex + 1) * bucketHours - 1) * HOUR_MS);
  };
}

/**
 * The display windows for a short period — unique, ascending, trailing 24h/72h —
 * with the aligner that produced them, so callers map their own points into the
 * same windows instead of re-deriving the anchor.
 */
export function getHourlyWindowBuckets(
  buckets: Iterable<string>,
  period: RegistryAnalyticsPeriodId,
): { buckets: string[]; align: HourlyBucketAligner } {
  const all = [...buckets];
  const align = createHourlyBucketAligner(all);
  const aligned = [...new Set(all.map(align))].sort((left, right) => left.localeCompare(right));
  const windowHours = period === "1d" ? 24 : 72;
  return { buckets: aligned.slice(-(windowHours / HOURLY_BUCKET_HOURS)), align };
}

/** Chart x label for a window, keyed by its start: "04:00" at 1d, "08-11 04:00" across days. */
export function formatHourlyBucketLabel(bucket: string, period: RegistryAnalyticsPeriodId): string {
  const time = bucket.slice(11, 16);
  return period === "1d" ? time : `${bucket.slice(5, 10)} ${time}`;
}

/**
 * Sparse ticks for hourly-derived charts: every window at 1d, every third (12h)
 * at 3d. Spacing counts back from the newest window — anchored windows no longer
 * land on midnight, and the newest is the one worth always labelling.
 */
export function getHourlyChartTicks(labels: string[], period: RegistryAnalyticsPeriodId): string[] {
  if (period === "1d") return labels;
  return labels.filter((_, index) => (labels.length - 1 - index) % 3 === 0);
}

export function getTodayUtcDate(nowMs = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

const CUSTOM_RANGE_DAY_MS = 86_400_000;

function parseUtcDate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** Inclusive day count of a range; 0 when either end is unparseable. */
export function getCustomRangeDayCount(range: RegistryAnalyticsCustomRange): number {
  const fromMs = parseUtcDate(range.from);
  const toMs = parseUtcDate(range.to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) return 0;
  return Math.round((toMs - fromMs) / CUSTOM_RANGE_DAY_MS) + 1;
}

/** True when the range charts 4h buckets from the hourly series. */
export function isHourlyCustomRange(range: RegistryAnalyticsCustomRange): boolean {
  const days = getCustomRangeDayCount(range);
  return days > 0 && days < HOURLY_RANGE_MAX_DAYS;
}

/** Every UTC day of the range, ascending and inclusive. */
export function getCustomRangeDates(range: RegistryAnalyticsCustomRange): string[] {
  const days = getCustomRangeDayCount(range);
  const fromMs = parseUtcDate(range.from);
  return Array.from({ length: days }, (_, index) =>
    new Date(fromMs + index * CUSTOM_RANGE_DAY_MS).toISOString().slice(0, 10),
  );
}

/**
 * The picker's validity rules; a human-readable error, or null when valid.
 * Sub-week ranges use the hourly series so they cannot start before its
 * floor, and only they may include the current (partial) UTC day; weekly and
 * longer ranges chart complete days, so they end no later than yesterday but
 * may start anywhere in the daily history.
 */
export function validateCustomRange(
  range: RegistryAnalyticsCustomRange,
  nowMs = Date.now(),
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(range.from) || !/^\d{4}-\d{2}-\d{2}$/.test(range.to)) {
    return "Enter both dates.";
  }
  const days = getCustomRangeDayCount(range);
  if (days === 0) return "The start date must be on or before the end date.";
  const today = getTodayUtcDate(nowMs);
  if (range.to > today) return "The end date cannot be in the future.";
  if (days >= HOURLY_RANGE_MAX_DAYS) {
    if (range.to >= today) {
      return "Ranges of a week or longer chart complete days - end no later than yesterday (UTC).";
    }
    return null;
  }
  if (range.from < HOURLY_SERIES_FLOOR_DATE) {
    return `Ranges shorter than a week use the hourly series, which starts ${HOURLY_SERIES_FLOOR_DATE}.`;
  }
  return null;
}

/**
 * The 4h display windows of a custom hourly range: buckets restricted to the
 * range's days, aligned into windows anchored at the newest in-range bucket
 * (mirroring getHourlyWindowBuckets), capped at the last 36 windows.
 */
export function getHourlyRangeBuckets(
  buckets: Iterable<string>,
  range: RegistryAnalyticsCustomRange,
): { buckets: string[]; align: HourlyBucketAligner } {
  const startKey = `${range.from}T00:00Z`;
  const endKey = `${range.to}T23:00Z`;
  const inRange = [...buckets].filter((bucket) => bucket >= startKey && bucket <= endKey);
  const align = createHourlyBucketAligner(inRange);
  const alignedInRange = new Set(inRange.map(align));
  const aligned = [...alignedInRange].sort((left, right) => left.localeCompare(right));
  return { buckets: aligned.slice(-HOURLY_RANGE_MAX_WINDOWS), align };
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
  /** Listings currently deprecated (not deleted), dated by deprecation.since. */
  deprecations: {
    total: number;
    maps: number;
    mods: number;
  };
  /** Listings permanently deleted on this date (deprecation.since with deleted=true). */
  deletions: {
    total: number;
    maps: number;
    mods: number;
  };
};

export type RegistryAnalyticsAuthorHistoryPoint = {
  date: string;
  authors: number;
};

export type RegistryAnalyticsProjectHistoryPoint = {
  date: string;
  projects: number;
};

export type RegistryAnalyticsEntityDailySeries = {
  /** Ascending date universe (YYYY-MM-DD) of the daily analytics window. */
  dates: string[];
  /** One daily series per charted entity (author, listing, project, ...). */
  entities: Array<{
    id: string;
    name: string;
    byDate: Map<string, { maps: number; mods: number }>;
    /** Fixed color for categories that own one; palette otherwise. */
    color?: string;
    /** Vocabulary for filter-by-search, mirroring the tab's rankings search. */
    searchValues?: string[];
  }>;
};

export type RegistryAnalyticsAuthorRanking = {
  id: string;
  name: string;
  href: string;
  /** Downloads over the ranking's period (adjusted, credit-attributed). */
  downloads: RegistryAnalyticsScopedValue;
  /** Assets this person authors (their own listings) — always all-time. */
  authored: RegistryAnalyticsScopedValue;
  /** Assets where this person is a plain collaborator (caretaken excluded) — always all-time. */
  collaborator: RegistryAnalyticsScopedValue;
  /** Assets this person caretakes — always all-time. */
  caretaker: RegistryAnalyticsScopedValue;
};

export type RegistryAnalyticsProjectRanking = {
  id: string;
  name: string;
  href: string;
  authorId: string;
  authorName: string;
  authorHref: string;
  /** Downloads over the ranking's period (adjusted). */
  downloads: RegistryAnalyticsScopedValue;
  /** All-time listing counts. */
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
    rankings: Record<RegistryAnalyticsPeriodId, RegistryAnalyticsAuthorRanking[]>;
    /** False while the window CSVs predate the per-type download-change columns. */
    hasTypeSplitWindows: boolean;
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
    history: RegistryAnalyticsProjectHistoryPoint[];
    rankings: Record<RegistryAnalyticsPeriodId, RegistryAnalyticsProjectRanking[]>;
    /** False while the window CSVs predate the per-type download-change columns. */
    hasTypeSplitWindows: boolean;
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
/**
 * Monthly hourly shard URLs, floor month through the current UTC month. A
 * month with no cached shard yet (first hours of a new month) degrades to an
 * empty CSV via optionalFetchText.
 */
export function getHourlyShardUrls(nowMs = Date.now()): string[] {
  const urls: string[] = [];
  let year = Number.parseInt(HOURLY_SERIES_FLOOR_DATE.slice(0, 4), 10);
  let month = Number.parseInt(HOURLY_SERIES_FLOOR_DATE.slice(5, 7), 10);
  const now = new Date(nowMs);
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth() + 1;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    urls.push(`/registry-cache/analytics/hourly/downloads-${key}.csv`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return urls;
}
export type RegistryAnalyticsWindowPeriodId = Exclude<RegistryAnalyticsPeriodId, "all-time">;
const WINDOW_PERIODS: RegistryAnalyticsWindowPeriodId[] = ["1d", "3d", "7d", "14d", "30d"];
const AUTHOR_WINDOW_RANKING_URLS: Record<RegistryAnalyticsWindowPeriodId, string> = {
  "1d": "/registry-cache/analytics/authors_last_1d.csv",
  "3d": "/registry-cache/analytics/authors_last_3d.csv",
  "7d": "/registry-cache/analytics/authors_last_7d.csv",
  "14d": "/registry-cache/analytics/authors_last_14d.csv",
  "30d": "/registry-cache/analytics/authors_last_30d.csv",
};
const PROJECT_WINDOW_RANKING_URLS: Record<RegistryAnalyticsWindowPeriodId, string> = {
  "1d": "/registry-cache/analytics/projects_most_popular_last_1d.csv",
  "3d": "/registry-cache/analytics/projects_most_popular_last_3d.csv",
  "7d": "/registry-cache/analytics/projects_most_popular_last_7d.csv",
  "14d": "/registry-cache/analytics/projects_most_popular_last_14d.csv",
  "30d": "/registry-cache/analytics/projects_most_popular_last_30d.csv",
};
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

/** Like safeFetchText but degrades to an empty CSV instead of failing the page. */
function optionalFetchText(url: string): Promise<string> {
  return fetch(url)
    .then((response) => (response.ok ? response.text() : ""))
    .catch(() => "");
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

/**
 * The listing's CURRENT retirement, or null once it is reversed. Closed windows
 * in `deprecation_history` are deliberately ignored: a listing arrives at most
 * once and departs at most once (its latest retirement), so an un-deprecated
 * listing keeps its original debut and nothing else. Escalating a deprecation
 * to a deletion carries the original `since`, so it moves buckets rather than
 * adding a second departure.
 */
function getDeprecationDate(item: RegistryAnalyticsItem): string | null {
  const manifest = item.manifest as { deprecation?: { since?: string } };
  const since = manifest?.deprecation?.since;
  if (typeof since !== "string") return null;
  const date = since.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function isDeletedItem(item: RegistryAnalyticsItem): boolean {
  const manifest = item.manifest as { deprecation?: { deleted?: boolean } };
  return manifest?.deprecation?.deleted === true;
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
    Pick<RegistryAnalyticsHistoryPoint, "downloads" | "listings" | "deprecations" | "deletions">
  >();

  for (const dateHeader of dateHeaders) {
    downloadsByDate.set(normalizeDate(dateHeader), {
      downloads: { total: 0, maps: 0, mods: 0 },
      listings: { total: 0, maps: 0, mods: 0 },
      deprecations: { total: 0, maps: 0, mods: 0 },
      deletions: { total: 0, maps: 0, mods: 0 },
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
      const bucket = isDeletedItem(item) ? deprecationDay.deletions : deprecationDay.deprecations;
      bucket.total += 1;
      bucket[typeKey] += 1;
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
        deletions: day.deletions,
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

/**
 * Cumulative count of multi-asset projects by day — the project analogue of
 * buildAuthorHistory. A project debuts at the earliest of its listings'
 * published dates, falling back to a listing's first recorded download
 * activity when the publish date is missing.
 */
function buildProjectHistory(
  rows: CsvRow[],
  validItemsById: Map<string, RegistryAnalyticsItem>,
  projectIds: ReadonlySet<string>,
): RegistryAnalyticsProjectHistoryPoint[] {
  const dateHeaders = getDateHeaders(rows);
  const firstDateByProject = new Map<string, string>();
  const setEarliest = (projectId: string | undefined, date: string | null) => {
    const normalizedId = projectId?.trim().toLowerCase();
    if (!normalizedId || !date || !projectIds.has(normalizedId)) return;
    const currentDate = firstDateByProject.get(normalizedId);
    if (!currentDate || date < currentDate) {
      firstDateByProject.set(normalizedId, date);
    }
  };

  for (const item of validItemsById.values()) {
    setEarliest(item.projectId ?? undefined, getPublishedDate(item));
  }
  for (const row of rows) {
    const item = validItemsById.get(row.id ?? "");
    if (!item) continue;
    setEarliest(item.projectId ?? undefined, getFirstActivityDate(row, dateHeaders));
  }

  return dateHeaders.map((dateKey) => {
    const date = normalizeDate(dateKey);
    return {
      date,
      projects: [...firstDateByProject.values()].filter((firstDate) => firstDate <= date).length,
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

/**
 * One daily series per project, aggregated over the project's listings.
 * Projects match the tab's definition (multi-asset); listings outside one —
 * including single-asset repos — are excluded rather than bucketed into a
 * catch-all, so both the chart and the share denominator stay a view of
 * projects (mirroring how the country series drops country-less listings).
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
    const projectId = item?.projectId?.trim().toLowerCase();
    const projectMeta = projectId ? projectMetaById.get(projectId) : undefined;
    if (!item || !projectId || !projectMeta) continue;
    const isMap = item.type === "maps";

    const entity = entitiesById.get(projectId) ?? {
      id: projectId,
      name: projectMeta.name,
      byDate: new Map<string, { maps: number; mods: number }>(),
      searchValues: projectMeta.searchValues,
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

function normalizeEntityId(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * True when the parsed window CSV carries the per-type download-change columns
 * (appended 2026-09; older caches lack them). Header-only files can't be
 * probed, so an empty parse counts as split-capable (there is nothing to show).
 */
function hasTypeSplitColumns(rows: CsvRow[]): boolean {
  return rows.length === 0 || "adjusted_map_download_change" in rows[0];
}

function buildAuthorRoleValues(
  author: Awaited<ReturnType<typeof loadCreatorDatabaseData>>["authors"][number] | undefined,
): Pick<RegistryAnalyticsAuthorRanking, "authored" | "collaborator" | "caretaker"> {
  return {
    authored: {
      total: author?.assets ?? 0,
      maps: author?.maps ?? 0,
      mods: author?.mods ?? 0,
    },
    collaborator: {
      total: author?.collaborations ?? 0,
      maps: author?.mapCollaborations ?? 0,
      mods: author?.modCollaborations ?? 0,
    },
    caretaker: {
      total: author?.caretakenAssets ?? 0,
      maps: author?.caretakenMaps ?? 0,
      mods: author?.caretakenMods ?? 0,
    },
  };
}

/**
 * All-time rankings come from the creator database (credit-attributed listing
 * totals); window rankings come from the registry's precomputed adjusted
 * per-window CSVs, joined back to the creator database for names and the
 * all-time role counts.
 */
function buildAuthorRankingsByPeriod(
  authors: Awaited<ReturnType<typeof loadCreatorDatabaseData>>["authors"],
  windowCsvRows: Record<RegistryAnalyticsWindowPeriodId, CsvRow[]>,
): {
  rankings: Record<RegistryAnalyticsPeriodId, RegistryAnalyticsAuthorRanking[]>;
  hasTypeSplitWindows: boolean;
} {
  const authorsById = new Map(authors.map((author) => [normalizeEntityId(author.id), author]));
  const allTime = authors
    .filter((author) => author.downloads > 0)
    .map((author) => ({
      id: author.id,
      name: author.label,
      href: author.href,
      downloads: {
        total: author.downloads,
        maps: author.mapDownloads,
        mods: author.modDownloads,
      },
      ...buildAuthorRoleValues(author),
    }))
    .sort((left, right) => right.downloads.total - left.downloads.total);

  const adminPersonId = normalizeEntityId(ADMIN_AUTHOR_ID);
  const buildWindow = (rows: CsvRow[]): RegistryAnalyticsAuthorRanking[] => {
    const rankings: RegistryAnalyticsAuthorRanking[] = [];
    for (const row of rows) {
      const id = row.author?.trim() ?? "";
      const normalizedId = normalizeEntityId(id);
      if (!id || normalizedId === adminPersonId) continue;
      const total = getNumber(row.adjusted_download_change || row.download_change);
      if (total <= 0) continue;
      const author = authorsById.get(normalizedId);
      rankings.push({
        id: author?.id ?? id,
        name: author?.label ?? row.author_alias?.trim() ?? id,
        href: author?.href ?? getRegistryAuthorUrl(id),
        downloads: {
          total,
          maps: getNumber(row.adjusted_map_download_change || row.map_download_change),
          mods: getNumber(row.adjusted_mod_download_change || row.mod_download_change),
        },
        ...buildAuthorRoleValues(author),
      });
    }
    return rankings.sort((left, right) => right.downloads.total - left.downloads.total);
  };

  return {
    rankings: {
      "all-time": allTime,
      "1d": buildWindow(windowCsvRows["1d"]),
      "3d": buildWindow(windowCsvRows["3d"]),
      "7d": buildWindow(windowCsvRows["7d"]),
      "14d": buildWindow(windowCsvRows["14d"]),
      "30d": buildWindow(windowCsvRows["30d"]),
    },
    hasTypeSplitWindows: WINDOW_PERIODS.every((period) =>
      hasTypeSplitColumns(windowCsvRows[period]),
    ),
  };
}

/**
 * Project analogue of buildAuthorRankingsByPeriod. Window rows join by the
 * registry's project_key; keys outside the creator database (single-asset
 * pseudo-projects) are dropped so every period lists the same universe of
 * multi-asset projects the all-time tab shows.
 */
function buildProjectRankingsByPeriod(
  projects: Awaited<ReturnType<typeof loadCreatorDatabaseData>>["projects"],
  windowCsvRows: Record<RegistryAnalyticsWindowPeriodId, CsvRow[]>,
): {
  rankings: Record<RegistryAnalyticsPeriodId, RegistryAnalyticsProjectRanking[]>;
  hasTypeSplitWindows: boolean;
} {
  const projectsById = new Map(projects.map((project) => [normalizeEntityId(project.id), project]));
  const toRanking = (
    project: (typeof projects)[number],
    downloads: RegistryAnalyticsScopedValue,
  ): RegistryAnalyticsProjectRanking => ({
    id: project.id,
    name: project.name,
    href: project.href,
    authorId: project.authorId,
    authorName: project.authorLabel,
    authorHref: project.authorHref,
    downloads,
    maps: project.maps,
    mods: project.mods,
    assets: project.assets,
  });

  const allTime = projects
    .map((project) =>
      toRanking(project, {
        total: project.downloads,
        maps: project.mapDownloads,
        mods: project.modDownloads,
      }),
    )
    .sort((left, right) => right.downloads.total - left.downloads.total);

  const buildWindow = (rows: CsvRow[]): RegistryAnalyticsProjectRanking[] => {
    const rankings: RegistryAnalyticsProjectRanking[] = [];
    for (const row of rows) {
      const project = projectsById.get(normalizeEntityId(row.project_key ?? ""));
      if (!project) continue;
      const total = getNumber(row.adjusted_download_change || row.download_change);
      if (total <= 0) continue;
      rankings.push(
        toRanking(project, {
          total,
          maps: getNumber(row.adjusted_map_download_change || row.map_download_change),
          mods: getNumber(row.adjusted_mod_download_change || row.mod_download_change),
        }),
      );
    }
    return rankings.sort((left, right) => right.downloads.total - left.downloads.total);
  };

  return {
    rankings: {
      "all-time": allTime,
      "1d": buildWindow(windowCsvRows["1d"]),
      "3d": buildWindow(windowCsvRows["3d"]),
      "7d": buildWindow(windowCsvRows["7d"]),
      "14d": buildWindow(windowCsvRows["14d"]),
      "30d": buildWindow(windowCsvRows["30d"]),
    },
    hasTypeSplitWindows: WINDOW_PERIODS.every((period) =>
      hasTypeSplitColumns(windowCsvRows[period]),
    ),
  };
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
 * Groups hourly points into `bucketHours` windows anchored at the newest hour
 * (see createHourlyBucketAligner), ascending; each grouped point keeps the
 * window's START hour as its bucket key.
 */
export function bucketRegistryAnalyticsHourly(
  hourly: RegistryAnalyticsHourlyPoint[],
  bucketHours = HOURLY_BUCKET_HOURS,
): RegistryAnalyticsHourlyPoint[] {
  const align = createHourlyBucketAligner(
    hourly.map((point) => point.bucket),
    bucketHours,
  );
  const byBucket = new Map<string, RegistryAnalyticsHourlyPoint["downloads"]>();
  for (const point of hourly) {
    const aligned = align(point.bucket);
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

/**
 * Trailing preset window over the daily history. Daily-grain presets (7d and
 * longer) cover the last N COMPLETE days — the current UTC day's partial
 * column is excluded — while the 1d/3d presets keep it (their charts run on
 * the 4h rollup, where the partial day is expected).
 */
export function filterRegistryAnalyticsHistory(
  history: RegistryAnalyticsHistoryPoint[],
  period: RegistryAnalyticsPeriodId,
  nowMs = Date.now(),
) {
  const periodDays = period === "all-time" ? null : Number.parseInt(period, 10);
  if (!periodDays) return history;
  const complete =
    !HOURLY_CHART_PERIODS.has(period) &&
    history[history.length - 1]?.date === getTodayUtcDate(nowMs)
      ? history.slice(0, -1)
      : history;
  if (complete.length <= periodDays) return complete;
  return complete.slice(-periodDays);
}

/** The history rows inside a custom range (closed interval). */
export function filterHistoryByRange(
  history: RegistryAnalyticsHistoryPoint[],
  range: RegistryAnalyticsCustomRange,
) {
  return history.filter((row) => row.date >= range.from && row.date <= range.to);
}

/**
 * Date list of a preset window over an entity series' date universe — the
 * date-array analogue of filterRegistryAnalyticsHistory (same complete-day
 * rule), so pies and Top charts sum exactly the days their charts draw.
 */
export function selectPresetDates(
  allDates: string[],
  period: RegistryAnalyticsPeriodId,
  nowMs = Date.now(),
): string[] {
  const periodDays = period === "all-time" ? null : Number.parseInt(period, 10);
  if (!periodDays) return allDates;
  const complete =
    !HOURLY_CHART_PERIODS.has(period) && allDates[allDates.length - 1] === getTodayUtcDate(nowMs)
      ? allDates.slice(0, -1)
      : allDates;
  return complete.slice(-periodDays);
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

/** Sum of an entity's daily values over a set of dates, split by type. */
function sumEntityOverDates(
  entity: RegistryAnalyticsEntityDailySeries["entities"][number],
  dates: string[],
): { total: number; maps: number; mods: number } {
  let maps = 0;
  let mods = 0;
  for (const date of dates) {
    const point = entity.byDate.get(date);
    if (!point) continue;
    maps += point.maps;
    mods += point.mods;
  }
  return { total: maps + mods, maps, mods };
}

/**
 * Content rankings for a custom range, summed from the per-listing daily
 * series (unadjusted deltas — a custom window matching a preset can differ
 * slightly from the preset's adjusted CSV numbers). Row metadata joins from
 * the all-time rankings by listing key.
 */
export function buildCustomContentRankings(
  data: RegistryAnalyticsData,
  range: RegistryAnalyticsCustomRange,
): Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]> {
  const dates = getCustomRangeDates(range);
  const metaByKey = new Map<string, RegistryAnalyticsContentRanking>();
  for (const type of ["maps", "mods"] as const) {
    for (const row of data.contentRankings["all-time"][type]) {
      metaByKey.set(`${row.type}:${row.id}`, row);
    }
  }
  const grouped: Record<RegistryAnalyticsAssetTypeId, RegistryAnalyticsContentRanking[]> = {
    maps: [],
    mods: [],
  };
  for (const entity of data.listings.dailyDownloads.entities) {
    const sums = sumEntityOverDates(entity, dates);
    if (sums.total <= 0) continue;
    const meta = metaByKey.get(`maps:${entity.id}`) ?? metaByKey.get(`mods:${entity.id}`);
    if (!meta) continue;
    grouped[meta.type].push({ ...meta, downloads: sums.total });
  }
  return {
    maps: grouped.maps.sort((left, right) => right.downloads - left.downloads),
    mods: grouped.mods.sort((left, right) => right.downloads - left.downloads),
  };
}

/**
 * Author rankings for a custom range, summed from the credit-attributed daily
 * series (admin already excluded there); names and the all-time role counts
 * join from the all-time rankings.
 */
export function buildCustomAuthorRankings(
  data: RegistryAnalyticsData,
  range: RegistryAnalyticsCustomRange,
): RegistryAnalyticsAuthorRanking[] {
  const dates = getCustomRangeDates(range);
  const metaById = new Map(
    data.authors.rankings["all-time"].map((row) => [normalizeEntityId(row.id), row]),
  );
  const rankings: RegistryAnalyticsAuthorRanking[] = [];
  for (const entity of data.authors.dailyDownloads.entities) {
    const sums = sumEntityOverDates(entity, dates);
    if (sums.total <= 0) continue;
    const meta = metaById.get(normalizeEntityId(entity.id));
    rankings.push({
      id: meta?.id ?? entity.id,
      name: meta?.name ?? entity.name,
      href: meta?.href ?? getRegistryAuthorUrl(entity.id),
      downloads: sums,
      authored: meta?.authored ?? { total: 0, maps: 0, mods: 0 },
      collaborator: meta?.collaborator ?? { total: 0, maps: 0, mods: 0 },
      caretaker: meta?.caretaker ?? { total: 0, maps: 0, mods: 0 },
    });
  }
  return rankings.sort((left, right) => right.downloads.total - left.downloads.total);
}

/** Project analogue of buildCustomAuthorRankings (multi-asset projects only). */
export function buildCustomProjectRankings(
  data: RegistryAnalyticsData,
  range: RegistryAnalyticsCustomRange,
): RegistryAnalyticsProjectRanking[] {
  const dates = getCustomRangeDates(range);
  const metaById = new Map(
    data.projects.rankings["all-time"].map((row) => [normalizeEntityId(row.id), row]),
  );
  const rankings: RegistryAnalyticsProjectRanking[] = [];
  for (const entity of data.projects.dailyDownloads.entities) {
    const sums = sumEntityOverDates(entity, dates);
    if (sums.total <= 0) continue;
    const meta = metaById.get(normalizeEntityId(entity.id));
    if (!meta) continue;
    rankings.push({ ...meta, downloads: sums });
  }
  return rankings.sort((left, right) => right.downloads.total - left.downloads.total);
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
    authorWindowRaws,
    projectWindowRaws,
  ] = await Promise.all([
    safeFetchText(AUTHORS_BY_DAY_URL),
    safeFetchText(MAP_STATISTICS_URL),
    safeFetchText(MOST_POPULAR_BY_DAY_URL),
    Promise.all(getHourlyShardUrls().map((url) => optionalFetchText(url))).then((raws) =>
      raws.join("\n"),
    ),
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
    Promise.all(
      WINDOW_PERIODS.map((period) => optionalFetchText(AUTHOR_WINDOW_RANKING_URLS[period])),
    ),
    Promise.all(
      WINDOW_PERIODS.map((period) => optionalFetchText(PROJECT_WINDOW_RANKING_URLS[period])),
    ),
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
  const creditWindowsByListing = buildListingCreditWindows(
    itemsByTypeRecord,
    authorLoginByGithubId,
  );
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
    const projectId = item?.projectId?.trim().toLowerCase();
    return projectId && projectMetaById.has(projectId) ? projectId : null;
  });
  const toWindowRows = (raws: string[]) =>
    Object.fromEntries(
      WINDOW_PERIODS.map((period, index) => [period, parseCsv(raws[index] ?? "")]),
    ) as Record<RegistryAnalyticsWindowPeriodId, CsvRow[]>;
  const authorRankings = buildAuthorRankingsByPeriod(
    creatorData.authors,
    toWindowRows(authorWindowRaws),
  );
  const projectRankings = buildProjectRankingsByPeriod(
    creatorData.projects,
    toWindowRows(projectWindowRaws),
  );
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
      rankings: authorRankings.rankings,
      hasTypeSplitWindows: authorRankings.hasTypeSplitWindows,
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
      history: buildProjectHistory(byDayRows, validItemsById, new Set(projectMetaById.keys())),
      rankings: projectRankings.rankings,
      hasTypeSplitWindows: projectRankings.hasTypeSplitWindows,
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
