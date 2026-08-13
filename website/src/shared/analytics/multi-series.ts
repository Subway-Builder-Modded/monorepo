import type { MultiSeriesPoint } from "@subway-builder-modded/analytics";
import { getSuiteById } from "@/config/site-navigation";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";

/**
 * The app-wide eight-color series carousel: the seven product/suite accents
 * plus Locomotive's rgb(176, 11, 105). Every multi-series chart (Railyard
 * versions, top authors, ...) draws from this set, repeating past eight.
 * Ordered so adjacent series alternate hue families for maximum contrast.
 */
export const MULTI_SERIES_PALETTE = [
  getSuiteById("registry").accent.light, // purple
  getSuiteById("railyard").accent.light, // green
  getSuiteById("website").accent.light, // orange
  getRegistryTypeConfigOrDefault("maps").accentLight, // blue
  "#b00b69", // Locomotive magenta
  getSuiteById("depot").accent.light, // gold
  getSuiteById("template-mod").accent.light, // light blue
  getRegistryTypeConfigOrDefault("mods").accentLight, // red
];

/** Muted color for the aggregated remainder series ("Others"). */
export const OTHERS_SERIES_COLOR = "#8a8a94";

/** Darker grey for permanently deleted listings. */
export const DELETED_SERIES_COLOR = "#55555c";

export type NamedDailySeries = {
  id: string;
  name: string;
  /** date (YYYY-MM-DD) -> value; absent dates count as 0. */
  valueByDate: ReadonlyMap<string, number>;
  /** Fixed color for synthetic categories (e.g. "No Project"); palette otherwise. */
  color?: string;
  /** Synthetic catch-all categories don't count toward the `minCount` floor. */
  synthetic?: boolean;
};

export type MultiSeriesChartModel = {
  /**
   * One config per drawn series, palette-colored, "Others" last and muted.
   * `total` is the series sum over the requested dates, so aggregate views
   * (pie charts, share tables) need no recomputation.
   */
  series: Array<{ key: string; name: string; color: string; total: number }>;
  /** One point per date with every drawn series keyed by its `key`. */
  data: MultiSeriesPoint[];
};

export type BucketedMultiSeries = {
  data: MultiSeriesPoint[];
  grain: "daily" | "weekly" | "monthly";
};

/** Measure-leading title prefix for a bucketed grain ("Weekly Downloads"). */
export function getGrainLabel(grain: BucketedMultiSeries["grain"]): string {
  return grain === "weekly" ? "Weekly" : grain === "monthly" ? "Monthly" : "Daily";
}

const DAY_MS = 86_400_000;

/**
 * Caps a daily multi-series chart at `maxPoints` x-entries by summing days
 * into trailing 7-day windows (falling back to 30-day windows if even those
 * overflow). Windows are anchored at the MOST RECENT day and labeled by each
 * window's start date, so the newest bucket is always a complete week/month —
 * only the oldest bucket can be partial. Under the cap, data passes through
 * untouched: short windows stay daily and long windows stay readable. Only
 * meaningful for flow data (sums); do not use on cumulative series.
 */
export function bucketMultiSeriesData(
  data: MultiSeriesPoint[],
  { xAxisKey = "date", maxPoints = 60 }: { xAxisKey?: string; maxPoints?: number } = {},
): BucketedMultiSeries {
  if (data.length <= maxPoints) {
    return { data, grain: "daily" };
  }

  const latestMs = Date.parse(`${String(data[data.length - 1][xAxisKey])}T00:00:00Z`);
  const bucketBy = (windowDays: number): MultiSeriesPoint[] => {
    const buckets = new Map<string, MultiSeriesPoint>();
    for (const point of data) {
      const pointMs = Date.parse(`${String(point[xAxisKey])}T00:00:00Z`);
      const windowIndex = Math.floor((latestMs - pointMs) / DAY_MS / windowDays);
      const windowStartMs = latestMs - ((windowIndex + 1) * windowDays - 1) * DAY_MS;
      const bucketKey = new Date(windowStartMs).toISOString().slice(0, 10);
      const bucket = buckets.get(bucketKey) ?? { [xAxisKey]: bucketKey };
      for (const [key, value] of Object.entries(point)) {
        if (key === xAxisKey || typeof value !== "number") continue;
        bucket[key] = ((bucket[key] as number) ?? 0) + value;
      }
      buckets.set(bucketKey, bucket);
    }
    return [...buckets.values()].sort((left, right) =>
      String(left[xAxisKey]).localeCompare(String(right[xAxisKey])),
    );
  };

  const weekly = bucketBy(7);
  if (weekly.length <= maxPoints) {
    return { data: weekly, grain: "weekly" };
  }
  return { data: bucketBy(30), grain: "monthly" };
}

/**
 * Reduces many per-entity daily series to the leading few over `dates`,
 * aggregating everything else into a single trailing "Others" series. The same
 * model feeds AnalyticsLineChart (one line per series), and
 * AnalyticsStackedBarChart (one stacked segment per series).
 *
 * Selection: with `minShare`, every entity whose share of the window total is
 * at least that fraction gets its own series (responsive to individual
 * spikes); `minCount` guarantees a floor even on flat distributions, and
 * `topCount` acts as a hard cap (and as the selector when `minShare` is
 * omitted).
 */
export function buildTopSeriesWithOthers({
  series,
  dates,
  topCount,
  minShare,
  minCount = 0,
  othersName = "Others",
}: {
  series: NamedDailySeries[];
  dates: string[];
  topCount: number;
  minShare?: number;
  minCount?: number;
  othersName?: string;
}): MultiSeriesChartModel {
  const totals = series
    .map((entry) => ({
      entry,
      total: dates.reduce((sum, date) => sum + (entry.valueByDate.get(date) ?? 0), 0),
    }))
    .filter(({ total }) => total > 0)
    .sort((left, right) => right.total - left.total);

  const grandTotal = totals.reduce((sum, { total }) => sum + total, 0);
  let drawnCount: number;
  if (minShare === undefined || grandTotal === 0) {
    drawnCount = topCount;
  } else {
    drawnCount = Math.min(
      topCount,
      totals.filter(({ total }) => total / grandTotal >= minShare).length,
    );
    // The floor counts real entities only: a synthetic catch-all (e.g.
    // "No Project") must not satisfy the minimum on its own.
    const availableReal = totals.filter(({ entry }) => !entry.synthetic).length;
    const targetReal = Math.min(minCount, availableReal);
    let drawnReal = totals.slice(0, drawnCount).filter(({ entry }) => !entry.synthetic).length;
    while (drawnReal < targetReal && drawnCount < Math.min(topCount, totals.length)) {
      if (!totals[drawnCount].entry.synthetic) drawnReal += 1;
      drawnCount += 1;
    }
  }
  const top = totals.slice(0, drawnCount);
  const rest = totals.slice(drawnCount);

  const seriesConfigs = top.map(({ entry, total }, index) => ({
    key: entry.id,
    name: entry.name,
    color: entry.color ?? MULTI_SERIES_PALETTE[index % MULTI_SERIES_PALETTE.length],
    total,
  }));
  const hasOthers = rest.length > 0;
  const othersKey = "__others__";
  if (hasOthers) {
    seriesConfigs.push({
      key: othersKey,
      name: othersName,
      color: OTHERS_SERIES_COLOR,
      total: rest.reduce((sum, { total }) => sum + total, 0),
    });
  }

  const data = dates.map((date) => {
    const point: MultiSeriesPoint = { date };
    for (const { entry } of top) {
      point[entry.id] = entry.valueByDate.get(date) ?? 0;
    }
    if (hasOthers) {
      point[othersKey] = rest.reduce(
        (sum, { entry }) => sum + (entry.valueByDate.get(date) ?? 0),
        0,
      );
    }
    return point;
  });

  return { series: seriesConfigs, data };
}
