import { useMemo, useState, type CSSProperties } from "react";
import { BarChart3, ChartPie, Map as MapIcon, Package } from "lucide-react";
import { AnalyticsPieChart } from "@subway-builder-modded/analytics";
import {
  bucketMultiSeriesData,
  buildTopSeriesWithOthers,
  getGrainLabel,
} from "@/shared/analytics/multi-series";
import { MultiSeriesChartCard } from "@/shared/analytics/multi-series-chart-card";
import { ChartCard, ChartEmptyState } from "@/shared/styles/panels";
import {
  REGISTRY_ANALYTICS_PERIOD_OPTIONS,
  RegistryAnalyticsPeriodToggle,
} from "@/features/registry/analytics/components/analytics-period-toggle";
import { RegistryTypeToggle } from "@/features/registry/components/registry-type-toggle";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import {
  HOURLY_CHART_PERIODS,
  formatHourlyBucketLabel,
  getHourlyChartTicks,
  getHourlyWindowBuckets,
  type RegistryAnalyticsEntityDailySeries,
  type RegistryAnalyticsEntityHourlySeries,
  type RegistryAnalyticsPeriodId,
} from "@/features/registry/analytics/lib/load-registry-analytics";

export type TopEntitiesAssetType = "total" | "maps" | "mods";

/** Every entity holding at least this share of the window total gets a series. */
const DEFAULT_MIN_SHARE = 0.05;
/** Floor so flat distributions (nobody above 5%) still show a leaderboard. */
const DEFAULT_MIN_COUNT = 3;
/** Hard cap so the palette and legend stay readable on flat distributions. */
const DEFAULT_SERIES_CAP = 10;

function getSeriesValue(
  entry: RegistryAnalyticsEntityDailySeries["entities"][number],
  date: string,
  assetType: TopEntitiesAssetType,
) {
  const point = entry.byDate.get(date);
  if (!point) return 0;
  if (assetType === "maps") return point.maps;
  if (assetType === "mods") return point.mods;
  return point.maps + point.mods;
}

/**
 * Daily downloads of the leading entities (authors, listings, projects, ...)
 * plus an aggregated "Others" series, with a "Download Share" pie of the same
 * window. Period and asset type can be controlled by the surrounding tab
 * (their toggles are then hidden, e.g. the Content tab drives both from its
 * URL) or left internal. The line-vs-stacked-bar switch is embedded in the
 * chart card: lines answer "who is trending"; stacked bars answer "what does
 * each day's total look like, and who contributed".
 */
export function TopEntitiesChart({
  series,
  hourlySeries,
  entityKey,
  period: controlledPeriod,
  assetType: controlledAssetType,
  defaultPeriod = "30d",
  minShare = DEFAULT_MIN_SHARE,
  minCount = DEFAULT_MIN_COUNT,
  seriesCap = DEFAULT_SERIES_CAP,
  filtered = false,
  emptyLabel = "No entries match the current filters.",
  titleSuffix = "",
  measureLabel = "Downloads",
  chartOthers = true,
}: {
  series: RegistryAnalyticsEntityDailySeries;
  /**
   * Hour-grain sibling of `series` (same entity ids). When present, 1d/3d cuts
   * chart wall-clock-aligned 4h UTC buckets instead of 1-3 daily bars; entity
   * names/colors still come from the daily series.
   */
  hourlySeries?: RegistryAnalyticsEntityHourlySeries;
  /** Stable slug for aria labels and chart keys, e.g. "authors", "projects". */
  entityKey: string;
  /** Controlled period: hides the period toggle and uses this value. */
  period?: RegistryAnalyticsPeriodId;
  /** Controlled asset type: hides the type toggle and uses this value. */
  assetType?: TopEntitiesAssetType;
  defaultPeriod?: RegistryAnalyticsPeriodId;
  minShare?: number;
  minCount?: number;
  seriesCap?: number;
  /** True when the surrounding tab is filtering the series (prefixes titles). */
  filtered?: boolean;
  /** Placeholder copy when the filter leaves nothing to chart. */
  emptyLabel?: string;
  /** Appended to both card titles, e.g. " by Country" when the section needs the noun. */
  titleSuffix?: string;
  /**
   * The measure both card titles name. The default keeps the generic pair
   * ("Daily Downloads" / "Download Share"); an override like "Map Downloads"
   * names the measure verbatim in both ("Weekly Map Downloads by Country" /
   * "Map Downloads by Country") to match sibling pies.
   */
  measureLabel?: string;
  /**
   * False renders the aggregated "Others" series only in the stacked-bar
   * view (and the pie) — never as a line. Use on flat distributions —
   * per-listing charts, where the Others line dwarfs every individual
   * series and flattens the top entries into illegibility. Pair with a
   * seriesCap of 8 so the drawn series map 1:1 onto the palette.
   */
  chartOthers?: boolean;
}) {
  const [internalPeriod, setInternalPeriod] = useState<RegistryAnalyticsPeriodId>(defaultPeriod);
  const [internalAssetType, setInternalAssetType] = useState<TopEntitiesAssetType>("total");
  const period = controlledPeriod ?? internalPeriod;
  const assetType = controlledAssetType ?? internalAssetType;
  const showPeriodToggle = controlledPeriod === undefined;
  const showTypeToggle = controlledAssetType === undefined;

  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");
  const assetTypeOptions = [
    {
      id: "total",
      label: "Total",
      pluralLabel: "Total",
      icon: BarChart3,
      accentLight: "var(--suite-accent-light)",
      accentDark: "var(--suite-accent-dark)",
    },
    {
      id: "maps",
      label: "Maps",
      pluralLabel: "Maps",
      icon: mapsConfig.icon ?? MapIcon,
      accentLight: mapsConfig.accentLight,
      accentDark: mapsConfig.accentDark,
    },
    {
      id: "mods",
      label: "Mods",
      pluralLabel: "Mods",
      icon: modsConfig.icon ?? Package,
      accentLight: modsConfig.accentLight,
      accentDark: modsConfig.accentDark,
    },
  ];
  const hourlyMode = HOURLY_CHART_PERIODS.has(period) && (hourlySeries?.entities.length ?? 0) > 0;
  const chartModel = useMemo(() => {
    // Hourly cut: same top-N/Others selection and pie, but the x universe is the
    // aligned 4h bucket labels and values come from the hour-grain series.
    // Entity display metadata joins from the daily series by id.
    if (hourlyMode && hourlySeries) {
      const { buckets: windowBuckets, align } = getHourlyWindowBuckets(
        hourlySeries.buckets,
        period,
      );
      const labelByBucket = new Map(
        windowBuckets.map((bucket) => [bucket, formatHourlyBucketLabel(bucket, period)]),
      );
      const labels = windowBuckets.map((bucket) => labelByBucket.get(bucket)!);
      const metaById = new Map((series?.entities ?? []).map((entry) => [entry.id, entry]));
      return buildTopSeriesWithOthers({
        series: hourlySeries.entities.map((entry) => {
          const meta = metaById.get(entry.id);
          const valueByLabel = new Map<string, number>();
          for (const [bucket, point] of entry.byBucket) {
            const label = labelByBucket.get(align(bucket));
            if (!label) continue;
            const value =
              assetType === "maps"
                ? point.maps
                : assetType === "mods"
                  ? point.mods
                  : point.maps + point.mods;
            valueByLabel.set(label, (valueByLabel.get(label) ?? 0) + value);
          }
          return {
            id: entry.id,
            name: meta?.name ?? entry.id,
            color: meta?.color,
            valueByDate: valueByLabel,
          };
        }),
        dates: labels,
        topCount: seriesCap,
        minShare,
        minCount,
      });
    }

    const periodDays =
      REGISTRY_ANALYTICS_PERIOD_OPTIONS.find((option) => option.id === period)?.days ?? null;
    const allDates = series?.dates ?? [];
    const dates = periodDays === null ? allDates : allDates.slice(-periodDays);
    return buildTopSeriesWithOthers({
      series: (series?.entities ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name,
        color: entry.color,
        valueByDate: new Map(dates.map((date) => [date, getSeriesValue(entry, date, assetType)])),
      })),
      dates,
      topCount: seriesCap,
      minShare,
      minCount,
    });
  }, [assetType, hourlyMode, hourlySeries, minCount, minShare, period, series, seriesCap]);

  // Long windows collapse into weekly (or monthly) buckets so the all-time
  // cut stays readable; short windows pass through daily (hourly rows are
  // already display-bucketed and pass through untouched). The pie keeps the
  // exact same totals either way.
  const bucketed = useMemo(() => bucketMultiSeriesData(chartModel.data), [chartModel.data]);
  const grainLabel = getGrainLabel(bucketed.grain);
  const chartTicks =
    period === "all-time"
      ? undefined
      : hourlyMode
        ? getHourlyChartTicks(
            bucketed.data.map((point) => String(point.date)),
            period,
          )
        : bucketed.data.map((point) => String(point.date));

  if (!series || series.dates.length === 0 || (series.entities.length === 0 && !filtered)) {
    return null;
  }

  const titlePrefix = filtered ? "Filtered " : "";
  // Flat distributions keep Others as a BAR-ONLY series: it stacks fine as a
  // segment but would flatten the individual lines. The line view is then a
  // top slice, and the title owns up to it ("Top 8 Weekly Downloads").
  const chartSeries = chartOthers
    ? chartModel.series
    : chartModel.series.map((entry) =>
        entry.key === "__others__" ? { ...entry, barOnly: true } : entry,
      );
  const realCount = chartModel.series.filter((entry) => entry.key !== "__others__").length;
  const isTopSlice = !chartOthers && realCount < chartModel.series.length;
  const chartTitle = hourlyMode
    ? isTopSlice
      ? `${titlePrefix}Top ${realCount} ${measureLabel}${titleSuffix} · 4h Buckets (UTC)`
      : `${titlePrefix}${measureLabel}${titleSuffix} · 4h Buckets (UTC)`
    : isTopSlice
      ? `${titlePrefix}Top ${realCount} ${grainLabel} ${measureLabel}${titleSuffix}`
      : `${titlePrefix}${grainLabel} ${measureLabel}${titleSuffix}`;

  return (
    <div className="space-y-4">
      {showPeriodToggle || showTypeToggle ? (
        <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">
          {showPeriodToggle ? (
            <RegistryAnalyticsPeriodToggle
              value={period}
              onChange={setInternalPeriod}
              className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
              style={
                {
                  "--registry-type-accent": "var(--suite-accent-light)",
                } as CSSProperties
              }
            />
          ) : null}
          {showTypeToggle ? (
            <RegistryTypeToggle
              activeTypeId={assetType}
              options={assetTypeOptions}
              showCounts={false}
              onChange={(nextType) => setInternalAssetType(nextType as TopEntitiesAssetType)}
              className="border-border/60 bg-card/70 shadow-sm ring-0 backdrop-blur-none"
              ariaLabel={`Top ${entityKey} asset type`}
            />
          ) : null}
        </div>
      ) : null}
      {chartModel.series.length === 0 ? (
        <ChartCard>
          <ChartEmptyState label={emptyLabel} />
        </ChartCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <MultiSeriesChartCard
            title={chartTitle}
            chartKey={`top-${entityKey}-${period}-${assetType}-${hourlyMode ? "hourly" : bucketed.grain}`}
            data={bucketed.data}
            series={chartSeries}
            xAxisTicks={chartTicks}
            stackId={entityKey}
            ariaLabelPrefix={`Top ${entityKey} chart`}
          />
          <ChartCard
            title={
              measureLabel === "Downloads"
                ? `${titlePrefix}Download Share${titleSuffix}`
                : `${titlePrefix}${measureLabel}${titleSuffix}`
            }
            icon={ChartPie}
          >
            <AnalyticsPieChart
              key={`top-${entityKey}-pie-${period}-${assetType}`}
              data={chartModel.series.map((entry) => ({
                key: entry.key,
                name: entry.name,
                value: entry.total,
                color: entry.color,
              }))}
              height={280}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
