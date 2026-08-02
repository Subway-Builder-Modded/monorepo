import { useMemo, useState, type CSSProperties } from "react";
import {
  BarChart3,
  ChartColumnBig,
  ChartLine,
  ChartPie,
  Map as MapIcon,
  Package,
} from "lucide-react";
import {
  AnalyticsLineChart,
  AnalyticsPieChart,
  AnalyticsStackedBarChart,
} from "@subway-builder-modded/analytics";
import {
  AnalyticsModeToggle,
  type AnalyticsToggleOption,
} from "@/shared/analytics/analytics-mode-toggle";
import { buildTopSeriesWithOthers } from "@/shared/analytics/multi-series";
import { ChartCard, ChartEmptyState } from "@/shared/styles/panels";
import {
  REGISTRY_ANALYTICS_PERIOD_OPTIONS,
  RegistryAnalyticsPeriodToggle,
} from "@/features/registry/analytics/components/analytics-period-toggle";
import { RegistryTypeToggle } from "@/features/registry/components/registry-type-toggle";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import type {
  RegistryAnalyticsEntityDailySeries,
  RegistryAnalyticsPeriodId,
} from "@/features/registry/analytics/lib/load-registry-analytics";

export type TopEntitiesAssetType = "total" | "maps" | "mods";
type TopEntitiesChartStyle = "line" | "bar";

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
  entityKey,
  period: controlledPeriod,
  assetType: controlledAssetType,
  defaultPeriod = "30d",
  minShare = DEFAULT_MIN_SHARE,
  minCount = DEFAULT_MIN_COUNT,
  seriesCap = DEFAULT_SERIES_CAP,
  filtered = false,
  emptyLabel = "No entries match the current filters.",
}: {
  series: RegistryAnalyticsEntityDailySeries;
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
}) {
  const [internalPeriod, setInternalPeriod] = useState<RegistryAnalyticsPeriodId>(defaultPeriod);
  const [internalAssetType, setInternalAssetType] = useState<TopEntitiesAssetType>("total");
  const [chartStyle, setChartStyle] = useState<TopEntitiesChartStyle>("line");
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
  const chartStyleOptions: Array<AnalyticsToggleOption<TopEntitiesChartStyle>> = [
    {
      id: "line",
      label: "Line chart",
      icon: ChartLine,
      accentLight: "var(--suite-accent-light)",
      accentDark: "var(--suite-accent-dark)",
    },
    {
      id: "bar",
      label: "Stacked bar chart",
      icon: ChartColumnBig,
      accentLight: "var(--suite-accent-light)",
      accentDark: "var(--suite-accent-dark)",
    },
  ];

  const chartModel = useMemo(() => {
    const periodDays =
      REGISTRY_ANALYTICS_PERIOD_OPTIONS.find((option) => option.id === period)?.days ?? null;
    const allDates = series?.dates ?? [];
    const dates = periodDays === null ? allDates : allDates.slice(-periodDays);
    return buildTopSeriesWithOthers({
      series: (series?.entities ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name,
        color: entry.color,
        synthetic: entry.synthetic,
        valueByDate: new Map(dates.map((date) => [date, getSeriesValue(entry, date, assetType)])),
      })),
      dates,
      topCount: seriesCap,
      minShare,
      minCount,
    });
  }, [assetType, minCount, minShare, period, series, seriesCap]);

  const chartTicks =
    period === "all-time" ? undefined : chartModel.data.map((point) => String(point.date));

  if (!series || series.dates.length === 0 || (series.entities.length === 0 && !filtered)) {
    return null;
  }

  const titlePrefix = filtered ? "Filtered " : "";

  return (
    <div className="space-y-4">
      {showPeriodToggle || showTypeToggle ? (
        <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">
          {showPeriodToggle ? (
            <RegistryAnalyticsPeriodToggle
              value={period}
              onChange={setInternalPeriod}
              className="grid-cols-2 sm:grid-cols-5"
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
          <ChartCard
            title={`${titlePrefix}Daily Downloads`}
            icon={ChartLine}
            actions={
              <AnalyticsModeToggle
                value={chartStyle}
                options={chartStyleOptions}
                onChange={setChartStyle}
                ariaLabel={`Top ${entityKey} chart style`}
                compact={true}
              />
            }
          >
            {chartStyle === "line" ? (
              <AnalyticsLineChart
                key={`top-${entityKey}-line-${period}-${assetType}`}
                data={chartModel.data}
                lines={chartModel.series}
                xAxisKey="date"
                xAxisTicks={chartTicks}
                height={280}
                startAtZero={true}
                hideZeroTooltipEntries={true}
              />
            ) : (
              <AnalyticsStackedBarChart
                key={`top-${entityKey}-bar-${period}-${assetType}`}
                data={chartModel.data}
                bars={chartModel.series.map((entry) => ({ ...entry, stackId: entityKey }))}
                xAxisKey="date"
                xAxisTicks={chartTicks}
                height={280}
              />
            )}
          </ChartCard>
          <ChartCard title={`${titlePrefix}Download Share`} icon={ChartPie}>
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
