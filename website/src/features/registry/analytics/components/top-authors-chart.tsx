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
import { ChartCard } from "@/shared/styles/panels";
import {
  REGISTRY_ANALYTICS_PERIOD_OPTIONS,
  RegistryAnalyticsPeriodToggle,
} from "@/features/registry/analytics/components/analytics-period-toggle";
import { RegistryTypeToggle } from "@/features/registry/components/registry-type-toggle";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import type {
  RegistryAnalyticsAuthorDailySeries,
  RegistryAnalyticsPeriodId,
} from "@/features/registry/analytics/lib/load-registry-analytics";

type TopAuthorsAssetType = "total" | "maps" | "mods";
type TopAuthorsChartStyle = "line" | "bar";

/** Every author holding at least this share of the window total gets a series. */
const AUTHOR_MIN_SHARE = 0.05;
/** Hard cap so the palette and legend stay readable on flat distributions. */
const AUTHOR_SERIES_CAP = 10;

function getSeriesValue(
  entry: RegistryAnalyticsAuthorDailySeries["authors"][number],
  date: string,
  assetType: TopAuthorsAssetType,
) {
  const point = entry.byDate.get(date);
  if (!point) return 0;
  if (assetType === "maps") return point.maps;
  if (assetType === "mods") return point.mods;
  return point.maps + point.mods;
}

/**
 * Daily downloads of the top authors (plus an aggregated "Others" series).
 * Mirrors the Content tab's control layout — period tabs left, asset-type
 * toggle right — with the line-vs-stacked-bar switch embedded in the chart
 * card. Lines answer "who is trending"; stacked bars answer "what does each
 * day's total look like, and who contributed".
 */
export function TopAuthorsChart({ series }: { series: RegistryAnalyticsAuthorDailySeries }) {
  const [period, setPeriod] = useState<RegistryAnalyticsPeriodId>("30d");
  const [assetType, setAssetType] = useState<TopAuthorsAssetType>("total");
  const [chartStyle, setChartStyle] = useState<TopAuthorsChartStyle>("line");

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
  const chartStyleOptions: Array<AnalyticsToggleOption<TopAuthorsChartStyle>> = [
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
      series: (series?.authors ?? []).map((entry) => ({
        id: entry.id,
        name: entry.name,
        valueByDate: new Map(dates.map((date) => [date, getSeriesValue(entry, date, assetType)])),
      })),
      dates,
      topCount: AUTHOR_SERIES_CAP,
      minShare: AUTHOR_MIN_SHARE,
    });
  }, [assetType, period, series]);

  const chartTicks =
    period === "all-time" ? undefined : chartModel.data.map((point) => String(point.date));

  if (!series || series.dates.length === 0 || series.authors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">
        <RegistryAnalyticsPeriodToggle
          value={period}
          onChange={setPeriod}
          className="grid-cols-2 sm:grid-cols-5"
          style={
            {
              "--registry-type-accent": "var(--suite-accent-light)",
            } as CSSProperties
          }
        />
        <RegistryTypeToggle
          activeTypeId={assetType}
          options={assetTypeOptions}
          showCounts={false}
          onChange={(nextType) => setAssetType(nextType as TopAuthorsAssetType)}
          className="border-border/60 bg-card/70 shadow-sm ring-0 backdrop-blur-none"
          ariaLabel="Top authors asset type"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ChartCard
          title="Daily Downloads"
          icon={ChartLine}
          actions={
            <AnalyticsModeToggle
              value={chartStyle}
              options={chartStyleOptions}
              onChange={setChartStyle}
              ariaLabel="Top authors chart style"
              compact={true}
            />
          }
        >
          {chartStyle === "line" ? (
            <AnalyticsLineChart
              key={`top-authors-line-${period}-${assetType}`}
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
              key={`top-authors-bar-${period}-${assetType}`}
              data={chartModel.data}
              bars={chartModel.series.map((entry) => ({ ...entry, stackId: "authors" }))}
              xAxisKey="date"
              xAxisTicks={chartTicks}
              height={280}
            />
          )}
        </ChartCard>
        <ChartCard title="Download Share" icon={ChartPie}>
          <AnalyticsPieChart
            key={`top-authors-pie-${period}-${assetType}`}
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
    </div>
  );
}
