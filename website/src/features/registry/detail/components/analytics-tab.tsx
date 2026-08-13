import { ChartPie, History, TrendingUp } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  RankBadge,
  ScrollArea,
  SectionSeparator,
  SortableTableHead,
  StaticTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@subway-builder-modded/shared-ui";
import type { PieSlice } from "@subway-builder-modded/analytics";
import {
  bucketMultiSeriesData,
  buildTopSeriesWithOthers,
  getGrainLabel,
  type NamedDailySeries,
} from "@/shared/analytics/multi-series";
import { MultiSeriesChartCard } from "@/shared/analytics/multi-series-chart-card";
import { PieChartCard } from "@/shared/analytics/pie-chart-card";
import {
  REGISTRY_ANALYTICS_PERIOD_OPTIONS,
  RegistryAnalyticsPeriodToggle,
} from "@/features/registry/analytics/components/analytics-period-toggle";
import {
  HOURLY_CHART_PERIODS,
  type RegistryAnalyticsPeriodId,
} from "@/features/registry/analytics/lib/load-registry-analytics";
import { TABLE_HEADER_ROW_CLASS } from "@/shared/styles/panels";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import { getAnalyticsTabSections } from "@/features/registry/detail/config/analytics-tab-config";
import { DetailsMetricGrid } from "@/features/registry/detail/components/details-tab";

type AnalyticsTabProps = {
  detail: RegistryDetailModel;
};

type SortDirection = "asc" | "desc";
type TrendSortKey = "label" | "downloads";

function formatNumber(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "\u2014";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  direction: SortDirection,
) {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "asc" ? left - right : right - left;
}

function getNextDirection<T extends string>(
  currentKey: T,
  nextKey: T,
  directions: Record<T, SortDirection>,
) {
  return currentKey === nextKey
    ? directions[nextKey] === "asc"
      ? "desc"
      : "asc"
    : directions[nextKey];
}

export function AnalyticsTab({ detail }: AnalyticsTabProps) {
  const sections = getAnalyticsTabSections(detail);
  const [trendSortKey, setTrendSortKey] = useState<TrendSortKey>("downloads");
  const [trendDirections, setTrendDirections] = useState<Record<TrendSortKey, SortDirection>>({
    label: "asc",
    downloads: "desc",
  });
  const trendDirection = trendDirections[trendSortKey];
  const sortedDownloadTrends = useMemo(() => {
    return [...detail.downloadTrends].sort((left, right) => {
      if (trendSortKey === "label") {
        return trendDirection === "asc"
          ? left.label.localeCompare(right.label)
          : right.label.localeCompare(left.label);
      }
      return compareNullableNumbers(left[trendSortKey], right[trendSortKey], trendDirection);
    });
  }, [detail.downloadTrends, trendDirection, trendSortKey]);

  // History chart: per-version stacked series over the selected period window
  // (a slice of the listing's trimmed daily history) when the version-grain
  // CSV covers this listing, otherwise a single listing-grain series. The pie
  // decomposes the same window, so both stay in agreement. Versions per
  // listing are a flat, small set — plain top-10 selection, like the other
  // per-listing charts.
  const [period, setPeriod] = useState<RegistryAnalyticsPeriodId>("all-time");
  const historyChart = useMemo(() => {
    const days = REGISTRY_ANALYTICS_PERIOD_OPTIONS.find((option) => option.id === period)?.days;
    const windowHistory = days ? detail.downloadHistory.slice(-days) : detail.downloadHistory;
    const dates = windowHistory.map((point) => point.date);
    const versionSeries: NamedDailySeries[] = detail.versionDownloadHistory.map((entry) => ({
      id: entry.version,
      name: entry.version,
      valueByDate: new Map(entry.history.map((point) => [point.date, point.downloads])),
    }));
    const versionModel = buildTopSeriesWithOthers({
      series: versionSeries,
      dates,
      topCount: 10,
    });
    const versionSlices: PieSlice[] = versionModel.series.map((entry) => ({
      key: entry.key,
      name: entry.name,
      value: entry.total,
      color: entry.color,
    }));

    // Short cuts draw from the hourly series (aligned 4h buckets: 6/18 points,
    // UTC) instead of 1-3 daily bars. The hourly grain carries no version split,
    // so the chart is single-series; the version pie still decomposes the
    // matching daily window.
    if (HOURLY_CHART_PERIODS.has(period) && detail.hourlyDownloads.length > 0) {
      const byBucket = new Map<string, number>();
      for (const point of detail.hourlyDownloads) {
        const hour = Number.parseInt(point.bucket.slice(11, 13), 10);
        if (!Number.isFinite(hour)) continue;
        const aligned = `${point.bucket.slice(0, 11)}${String(Math.floor(hour / 4) * 4).padStart(2, "0")}:00Z`;
        byBucket.set(aligned, (byBucket.get(aligned) ?? 0) + point.downloads);
      }
      const withDate = period !== "1d";
      const data = [...byBucket.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-((period === "1d" ? 24 : 72) / 4))
        .map(([bucket, downloads]) => ({
          date: withDate ? `${bucket.slice(5, 10)} ${bucket.slice(11, 16)}` : bucket.slice(11, 16),
          Downloads: downloads,
        }));
      return {
        bucketed: { data, grain: "daily" as const },
        chartTicks:
          period === "1d"
            ? data.map((point) => point.date)
            : data.map((point) => point.date).filter((label) => label.endsWith("00:00")),
        series: [{ key: "Downloads", name: "Downloads", color: "var(--registry-type-accent)" }],
        hasVersions: false,
        hourlyMode: true,
        versionSlices,
      };
    }

    const hasVersions = versionModel.series.length > 0;
    const data = hasVersions
      ? versionModel.data
      : windowHistory.map((point) => ({ date: point.date, Downloads: point.downloads }));
    const series = hasVersions
      ? versionModel.series
      : [{ key: "Downloads", name: "Downloads", color: "var(--registry-type-accent)" }];
    const bucketed = bucketMultiSeriesData(data);
    const chartTicks = days ? bucketed.data.map((point) => String(point.date)) : undefined;

    return { bucketed, chartTicks, series, hasVersions, hourlyMode: false, versionSlices };
  }, [detail.downloadHistory, detail.hourlyDownloads, detail.versionDownloadHistory, period]);
  const chartData = historyChart.bucketed.data;

  if (sections.length === 0 && chartData.length === 0 && detail.downloadTrends.length === 0) {
    return null;
  }

  const handleTrendSort = (nextKey: TrendSortKey) => {
    setTrendDirections((current) => ({
      ...current,
      [nextKey]: getNextDirection(trendSortKey, nextKey, current),
    }));
    setTrendSortKey(nextKey);
  };

  return (
    <section
      className="space-y-3 [--accent:var(--registry-type-accent)]"
      style={{ "--registry-type-accent": detail.typeConfig.accentLight } as CSSProperties}
    >
      {sections.map((section, index) => (
        <div key={`${section.title}-${index}`}>
          <SectionSeparator
            label={section.title}
            icon={section.icon}
            className={index === 0 ? "mb-4" : "mb-4 mt-7"}
          />
          <DetailsMetricGrid
            className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            items={section.cards}
            accentLight={detail.typeConfig.accentLight}
            accentDark={detail.typeConfig.accentDark}
          />
        </div>
      ))}

      {detail.downloadTrends.length > 0 ? (
        <div>
          <SectionSeparator label="Recent Trends" icon={TrendingUp} className="mb-4 mt-7" />
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
            <ScrollArea scrollbars="horizontal" className="w-full">
              <div className="min-w-[40rem] xl:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow className={TABLE_HEADER_ROW_CLASS}>
                      <SortableTableHead
                        label="Period"
                        active={trendSortKey === "label"}
                        direction={trendDirection}
                        onClick={() => handleTrendSort("label")}
                      />
                      <SortableTableHead
                        label="Downloads"
                        active={trendSortKey === "downloads"}
                        direction={trendDirection}
                        onClick={() => handleTrendSort("downloads")}
                      />
                      <StaticTableHead label="Rank" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDownloadTrends.map((trend) => (
                      <TableRow
                        key={trend.period}
                        className="border-border/60 hover:bg-transparent"
                      >
                        <TableCell className="px-4 font-medium text-foreground">
                          {trend.label}
                        </TableCell>
                        <TableCell className="px-4 font-semibold tabular-nums text-[var(--registry-type-accent)]">
                          {formatNumber(trend.downloads)}
                        </TableCell>
                        <TableCell className="px-4">
                          <RankBadge rank={trend.rank} className="size-7 text-xs" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : null}

      {detail.downloadHistory.length > 0 ? (
        <div>
          <SectionSeparator label="Download History" icon={History} className="mb-4 mt-7" />
          <div className="space-y-4">
            <div className="flex justify-center">
              <RegistryAnalyticsPeriodToggle value={period} onChange={setPeriod} />
            </div>
            <div
              className={
                historyChart.versionSlices.length > 1
                  ? "grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
                  : undefined
              }
            >
              <MultiSeriesChartCard
                title={
                  historyChart.hourlyMode
                    ? "Downloads · 4h Buckets (UTC)"
                    : `${getGrainLabel(historyChart.bucketed.grain)} Downloads${
                        historyChart.hasVersions ? " by Version" : ""
                      }`
                }
                chartKey={`listing-history-${period}-${historyChart.hourlyMode ? "hourly" : historyChart.bucketed.grain}`}
                data={chartData}
                series={historyChart.series}
                xAxisTicks={historyChart.chartTicks}
                height={280}
                stackId="listing-history"
                ariaLabelPrefix="Download history chart"
              />
              {historyChart.versionSlices.length > 1 ? (
                <PieChartCard
                  title="Download Share by Version"
                  icon={ChartPie}
                  data={historyChart.versionSlices}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
