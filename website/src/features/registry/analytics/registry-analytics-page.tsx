import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Activity,
  BookText,
  CalendarRange,
  ChartLine,
  ChartPie,
  Download,
  ExternalLink,
  FileStack,
  FolderGit2,
  Globe,
  LayoutDashboard,
  Map as MapAreaIcon,
  Plus,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SectionSeparator,
  SortableTableHead,
  StaticTableHead,
  SuiteAccentScope,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  RankBadge,
  ScrollArea,
  getSortedRankSlotMap,
} from "@subway-builder-modded/shared-ui";
import type { PieSlice } from "@subway-builder-modded/analytics";
import { getSuiteAnalyticsNavItem, getSuiteById } from "@/config/site-navigation";
import { getCountryFlagIcon } from "@/lib/country-flags";
import {
  MULTI_SERIES_PALETTE,
  DELETED_SERIES_COLOR,
  OTHERS_SERIES_COLOR,
  bucketMultiSeriesData,
  getGrainLabel,
} from "@/shared/analytics/multi-series";
import { MultiSeriesChartCard } from "@/shared/analytics/multi-series-chart-card";
import { PieChartCard } from "@/shared/analytics/pie-chart-card";
import { RegistryAnalyticsPeriodToggle as PeriodToggle } from "@/features/registry/analytics/components/analytics-period-toggle";
import {
  CHART_CARD_CLASS,
  CHART_CARD_FLUSH_CLASS,
  ChartEmptyState,
  TABLE_HEADER_ROW_CLASS,
} from "@/shared/styles/panels";
import { ACCENT_TEXT_LINK_CLASS } from "@/features/registry/lib/registry-styles";
import { TopEntitiesChart } from "@/features/registry/analytics/components/top-entities-chart";
import { Link, navigate } from "@/lib/router";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import { RegistryEmptyState } from "@/features/registry/components/browse/registry-empty-state";
import { RegistryTabs } from "@/features/registry/components/registry-tabs";
import { RegistryToolbarSearch } from "@/features/registry/components/registry-toolbar-search";
import { RegistryTypeToggle } from "@/features/registry/components/registry-type-toggle";
import { AuthorRoleBadge } from "@/features/registry/components/author-role-badge";
import {
  DetailsMetricGrid,
  type DetailMetric,
} from "@/features/registry/detail/components/details-tab";
import {
  REGISTRY_TYPES,
  getRegistryTypeConfigOrDefault,
} from "@/features/registry/registry-type-config";
import { getRegistryAuthorUrl, getRegistryDetailUrl } from "@/features/registry/lib/routing";
import {
  buildRegistryCountrySearchValues,
  matchesRegistrySearch,
} from "@/features/registry/lib/registry-search";
import {
  filterRegistryAnalyticsHistory,
  loadRegistryAnalyticsData,
  sumRegistryAnalyticsHistory,
  type RegistryAnalyticsAssetTypeId,
  type RegistryAnalyticsAuthorRanking,
  type RegistryAnalyticsContentRanking,
  type RegistryAnalyticsData,
  type RegistryAnalyticsEntityDailySeries,
  type RegistryAnalyticsMapStatisticRanking,
  type RegistryAnalyticsPeriodId,
  type RegistryAnalyticsProjectRanking,
} from "@/features/registry/analytics/lib/load-registry-analytics";

export type RegistryAnalyticsTabId =
  | "overview"
  | "content"
  | "authors"
  | "projects"
  | "map-statistics";

type RegistryAnalyticsPageProps = {
  tabId?: RegistryAnalyticsTabId;
  periodId?: RegistryAnalyticsPeriodId;
  assetTypeId?: RegistryAnalyticsAssetTypeId;
};

type RegistryAnalyticsTabItem = {
  id: RegistryAnalyticsTabId;
  label: string;
  icon: LucideIcon;
};

const TABS: RegistryAnalyticsTabItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "content", label: "Content", icon: FileStack },
  { id: "authors", label: "Authors", icon: Users },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "map-statistics", label: "Map Statistics", icon: MapAreaIcon },
];

const TAB_PATHS: Record<RegistryAnalyticsTabId, string> = {
  overview: "/registry/analytics/overview/all-time",
  content: "/registry/analytics/content/all-time/maps",
  authors: "/registry/analytics/authors",
  projects: "/registry/analytics/projects",
  "map-statistics": "/registry/analytics/map-statistics",
};

const OVERVIEW_PERIOD_PATHS: Record<RegistryAnalyticsPeriodId, string> = {
  "all-time": "/registry/analytics/overview/all-time",
  "3d": "/registry/analytics/overview/3d",
  "7d": "/registry/analytics/overview/7d",
  "14d": "/registry/analytics/overview/14d",
  "30d": "/registry/analytics/overview/30d",
};

const CONTENT_ASSET_INCREMENT = 20;
const AUTHOR_RANKING_INCREMENT = 20;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function getContentPath(
  period: RegistryAnalyticsPeriodId,
  assetTypeId: RegistryAnalyticsAssetTypeId,
) {
  return `/registry/analytics/content/${period}/${assetTypeId}`;
}

function getGraphHistory(
  history: RegistryAnalyticsData["history"],
  period: RegistryAnalyticsPeriodId,
) {
  const periodDays = period === "all-time" ? null : Number.parseInt(period, 10);
  if ((period === "3d" || period === "7d") && periodDays && history.length > periodDays) {
    return history.slice(-(periodDays + 1));
  }
  return filterRegistryAnalyticsHistory(history, period);
}

function buildOverviewCards(data: RegistryAnalyticsData): DetailMetric[] {
  return [
    {
      title: "Downloads",
      value: formatNumber(data.overview.downloads),
      icon: ChartLine,
    },
    {
      title: "Listings",
      value: formatNumber(data.overview.listings),
      icon: FileStack,
    },
    {
      title: "Authors",
      value: formatNumber(data.overview.authors),
      icon: Users,
    },
  ];
}

function RegistryAnalyticsTabs({
  activeTab,
  onChange,
}: {
  activeTab: RegistryAnalyticsTabId;
  onChange: (tabId: RegistryAnalyticsTabId) => void;
}) {
  return (
    <RegistryTabs
      value={activeTab}
      tabs={TABS}
      ariaLabel="Registry analytics tabs"
      onValueChange={onChange}
    />
  );
}

function buildPeriodBreakdown(data: RegistryAnalyticsData, period: RegistryAnalyticsPeriodId) {
  if (period === "all-time") {
    return {
      listings: {
        maps: data.overview.maps.listings,
        mods: data.overview.mods.listings,
      },
      downloads: {
        maps: data.overview.maps.downloads,
        mods: data.overview.mods.downloads,
      },
    };
  }

  const totals = sumRegistryAnalyticsHistory(filterRegistryAnalyticsHistory(data.history, period));
  return {
    listings: {
      maps: totals.listings.maps,
      mods: totals.listings.mods,
    },
    downloads: {
      maps: totals.downloads.maps,
      mods: totals.downloads.mods,
    },
  };
}

function RegistryOverviewTab({
  data,
  period,
}: {
  data: RegistryAnalyticsData;
  period: RegistryAnalyticsPeriodId;
}) {
  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");
  const graphRows = useMemo(
    () =>
      filterRegistryAnalyticsHistory(data.history, period).filter(
        (row) => row.date !== "2026-03-11",
      ),
    [data.history, period],
  );
  // One series per asset type, derived from the registry config so a future
  // asset type extends every Overview chart without edits here.
  const typeSeries = REGISTRY_TYPES.map((typeConfig) => {
    const config = getRegistryTypeConfigOrDefault(typeConfig.id);
    return {
      id: typeConfig.id,
      key: config.pluralLabel,
      name: config.pluralLabel,
      color: config.accentLight,
    };
  });
  const readTypeValue = (record: Record<string, number>, typeId: string) => record[typeId] ?? 0;
  const chartData = graphRows.map((row) => ({
    date: row.date,
    ...Object.fromEntries(
      typeSeries.map((series) => [series.key, readTypeValue(row.downloads, series.id)]),
    ),
  }));
  const cumulativeChartData = data.history.map((row) => ({
    date: row.date,
    ...Object.fromEntries(
      typeSeries.map((series) => [series.key, readTypeValue(row.cumulativeDownloads, series.id)]),
    ),
  }));
  // Releases are sparse at day grain; the shared bucketing collapses the
  // all-time cut to weeks while short cuts show recent uptake day by day.
  // Deprecations chart as a POSITIVE grey series (the asset still exists,
  // just retired — and the state is reversible); deletions chart NEGATIVE in
  // a darker grey below the axis: an actively lost listing nets to zero
  // against its arrival instead of counting twice.
  const hasDeprecations = graphRows.some((row) => row.deprecations.total > 0);
  const hasDeletions = graphRows.some((row) => (row.deletions?.total ?? 0) > 0);
  const newListingsBucketed = bucketMultiSeriesData(
    graphRows.map((row) => ({
      date: row.date,
      ...Object.fromEntries(
        typeSeries.map((series) => [series.key, readTypeValue(row.listings, series.id)]),
      ),
      ...(hasDeprecations ? { Deprecated: row.deprecations.total } : {}),
      ...(hasDeletions ? { Deleted: -(row.deletions?.total ?? 0) } : {}),
    })),
  );
  const newListingsSeries = [
    ...typeSeries,
    ...(hasDeprecations
      ? [{ key: "Deprecated", name: "Deprecated", color: OTHERS_SERIES_COLOR }]
      : []),
    ...(hasDeletions ? [{ key: "Deleted", name: "Deleted", color: DELETED_SERIES_COLOR }] : []),
  ];
  const newListingsGrainLabel = getGrainLabel(newListingsBucketed.grain);
  const chartTicks = period === "all-time" ? undefined : chartData.map((point) => point.date);
  // Average downloads per weekday over the full history — the registry's
  // weekly activity rhythm (all-time, so it sits above the period break).
  const weekdaySums = WEEKDAY_LABELS.map(() => ({
    days: 0,
    byType: {} as Record<string, number>,
  }));
  for (const row of data.history) {
    if (row.date === "2026-03-11") continue;
    const weekdayIndex = (new Date(`${row.date}T00:00:00Z`).getUTCDay() + 6) % 7;
    const bucket = weekdaySums[weekdayIndex];
    bucket.days += 1;
    for (const series of typeSeries) {
      bucket.byType[series.key] =
        (bucket.byType[series.key] ?? 0) + readTypeValue(row.downloads, series.id);
    }
  }
  const weekdayChartData = WEEKDAY_LABELS.map((day, index) => ({
    day,
    ...Object.fromEntries(
      typeSeries.map((series) => [
        series.key,
        weekdaySums[index].days > 0
          ? Math.round((weekdaySums[index].byType[series.key] ?? 0) / weekdaySums[index].days)
          : 0,
      ]),
    ),
  }));
  // Period-scoped share pies from grouped entity series.
  const buildEntityPeriodSlices = (
    series: RegistryAnalyticsEntityDailySeries | undefined,
    {
      value = "total",
      limit,
      minShare,
    }: { value?: "total" | "maps" | "mods"; limit?: number; minShare?: number } = {},
  ): PieSlice[] => {
    const allDates = series?.dates ?? [];
    const periodDays = period === "all-time" ? null : Number.parseInt(period, 10);
    const dates = periodDays === null ? allDates : allDates.slice(-periodDays);
    const sorted = (series?.entities ?? [])
      .map((entity) => ({
        entity,
        total: dates.reduce((sum, date) => {
          const point = entity.byDate.get(date);
          if (!point) return sum;
          const pointValue =
            value === "maps" ? point.maps : value === "mods" ? point.mods : point.maps + point.mods;
          return sum + pointValue;
        }, 0),
      }))
      .filter(({ total }) => total > 0)
      .sort((left, right) => right.total - left.total);
    const grandTotal = sorted.reduce((sum, { total }) => sum + total, 0);
    let drawnCount = sorted.length;
    if (minShare !== undefined && grandTotal > 0) {
      drawnCount = sorted.filter(({ total }) => total / grandTotal >= minShare).length;
    }
    if (limit && drawnCount > limit) {
      drawnCount = limit - 1;
    }
    const top = sorted.slice(0, drawnCount);
    const rest = sorted.slice(top.length);
    const slices: PieSlice[] = top.map(({ entity, total }, index) => ({
      key: entity.id,
      name: entity.name,
      value: total,
      color: entity.color ?? MULTI_SERIES_PALETTE[index % MULTI_SERIES_PALETTE.length],
    }));
    if (rest.length > 0) {
      slices.push({
        key: "__others__",
        name: "Others",
        value: rest.reduce((sum, { total }) => sum + total, 0),
        color: OTHERS_SERIES_COLOR,
      });
    }
    return slices;
  };
  // Same 2.5% share threshold as the Top Countries chart (regions are the
  // same geographic measure), so the long tail folds into Others.
  const regionSlices = buildEntityPeriodSlices(data.regions?.dailyDownloads, {
    minShare: 0.025,
    limit: 10,
  });
  const authorMapSlices = buildEntityPeriodSlices(data.authors?.dailyDownloads, {
    value: "maps",
    limit: 8,
  });
  const breakdown = buildPeriodBreakdown(data, period);
  const listingSlices: PieSlice[] = typeSeries.map((series) => ({
    key: series.id,
    name: series.name,
    value: readTypeValue(breakdown.listings, series.id),
    color: series.color,
  }));
  const downloadSlices: PieSlice[] = typeSeries.map((series) => ({
    key: series.id,
    name: series.name,
    value: readTypeValue(breakdown.downloads, series.id),
    color: series.color,
  }));

  return (
    <section
      className="space-y-6"
      style={
        {
          "--registry-maps-accent": mapsConfig.accentLight,
          "--registry-mods-accent": modsConfig.accentLight,
        } as CSSProperties
      }
    >
      <section className="space-y-3">
        <SectionSeparator label="Overview" icon={LayoutDashboard} className="mb-4" />
        <DetailsMetricGrid
          items={buildOverviewCards(data)}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          accentLight="var(--suite-accent-light)"
          accentDark="var(--suite-accent-dark)"
        />
      </section>

      <section className="space-y-3">
        <SectionSeparator label="Cumulative Downloads" icon={ChartLine} className="mb-4" />
        <MultiSeriesChartCard
          title="Cumulative Downloads"
          chartKey="registry-cumulative-downloads"
          data={cumulativeChartData}
          series={typeSeries}
          height={280}
          stackId="cumulative"
          defaultStyle="bar"
          ariaLabelPrefix="Cumulative downloads chart"
        />
      </section>

      <section className="space-y-3">
        <SectionSeparator label="Seasonality" icon={Activity} className="mb-4" />
        <MultiSeriesChartCard
          title="Average Daily Downloads"
          chartKey="registry-weekday-rhythm"
          data={weekdayChartData}
          series={typeSeries}
          xAxisKey="day"
          xAxisTicks={WEEKDAY_LABELS}
          height={280}
          stackId="weekday"
          defaultStyle="bar"
          ariaLabelPrefix="Weekly rhythm chart"
        />
      </section>

      {/* Everything above is all-time; everything below follows the selected
          period. The labeled break + attached toggle make that scope visible. */}
      <section className="space-y-4 pt-4">
        <SectionSeparator label="By Period" icon={CalendarRange} className="mb-4" />
        <div className="flex justify-center">
          <PeriodToggle
            value={period}
            onChange={(nextPeriod) =>
              navigate(OVERVIEW_PERIOD_PATHS[nextPeriod], {
                preserveScroll: true,
              })
            }
          />
        </div>
      </section>

      {/* One measure per section: Downloads and Maps chart downloads, Listings
          counts listings — every card title names its measure, and each pie
          sits beside the chart whose numbers it decomposes. */}
      <section className="space-y-3">
        <SectionSeparator label="Downloads" icon={Download} className="mb-4" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <MultiSeriesChartCard
            title="Daily Downloads"
            chartKey={`registry-downloads-${period}`}
            data={chartData}
            series={typeSeries}
            xAxisTicks={chartTicks}
            height={280}
            stackId="downloads"
            ariaLabelPrefix="Downloads timeline chart"
          />
          <PieChartCard title="Download Share" icon={ChartPie} data={downloadSlices} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionSeparator label="Maps" icon={mapsConfig.icon ?? MapAreaIcon} className="mb-4" />
        {/* Country downloads run much flatter than authors (only 4-6 of 42
            active countries clear 5%), so this chart uses a 2.5% share
            threshold — typically 10+ countries, bound by the series cap. */}
        <TopEntitiesChart
          series={data.countries.dailyDownloads}
          entityKey="countries"
          period={period}
          assetType="total"
          minShare={0.025}
          titleSuffix=" by Country"
          measureLabel="Map Downloads"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <PieChartCard title="Map Downloads by Region" icon={Globe} data={regionSlices} />
          <PieChartCard title="Map Downloads by Author" icon={Users} data={authorMapSlices} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionSeparator label="Listings" icon={FileStack} className="mb-4" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <MultiSeriesChartCard
            title={`${newListingsGrainLabel} New Listings`}
            chartKey={`registry-new-listings-${period}-${newListingsBucketed.grain}`}
            data={newListingsBucketed.data}
            series={newListingsSeries}
            height={280}
            stackId="new-listings"
            defaultStyle="bar"
            ariaLabelPrefix="New listings chart"
          />
          <PieChartCard
            title={`${period === "all-time" ? "Listings" : "New Listings"} by Type`}
            icon={FileStack}
            data={listingSlices}
          />
        </div>
      </section>
    </section>
  );
}

function compareDownloads(
  left: RegistryAnalyticsContentRanking,
  right: RegistryAnalyticsContentRanking,
  direction: "asc" | "desc",
) {
  return direction === "asc" ? left.downloads - right.downloads : right.downloads - left.downloads;
}

function getContentRankingKey(row: RegistryAnalyticsContentRanking) {
  return `${row.type}:${row.id}`;
}

type RegistryRankingColumn<TRow> = {
  id: string;
  label: string;
  width: string;
  sortable?: boolean;
  active?: boolean;
  direction?: "asc" | "desc";
  align?: "left" | "right";
  accentColor?: string;
  cellClassName?: string;
  onSort?: () => void;
  render: (row: TRow) => ReactNode;
};

function AnalyticsAuthorCell({
  authorId,
  authorName,
  accentColor = "var(--suite-accent-light)",
}: {
  authorId: string;
  authorName: string;
  accentColor?: string;
}) {
  return (
    <span
      className="inline-flex w-full min-w-0 max-w-full items-center gap-1.5"
      style={{ "--analytics-author-accent": accentColor } as CSSProperties}
    >
      <Link
        to={getRegistryAuthorUrl(authorId, "analytics")}
        className={`inline-flex min-w-0 max-w-full items-center gap-1.5 [--ui-link-accent:var(--analytics-author-accent)] ${ACCENT_TEXT_LINK_CLASS}`}
        title={authorName}
      >
        <span className="truncate">{authorName}</span>
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
      </Link>
      <AuthorRoleBadge authorId={authorId} className="shrink-0" />
    </span>
  );
}

function RegistryRankingsTable<TRow>({
  rows,
  rankByRowKey,
  visibleCount,
  emptyTypeId,
  query,
  onClearSearch,
  onLoadMore,
  getRowKey,
  columns,
}: {
  rows: TRow[];
  rankByRowKey: Map<string, number | null>;
  visibleCount: number;
  emptyTypeId: string;
  query: string;
  onClearSearch: () => void;
  onLoadMore: () => void;
  getRowKey: (row: TRow) => string;
  columns: RegistryRankingColumn<TRow>[];
}) {
  const visibleRows = rows.slice(0, visibleCount);
  const hasMoreRows = visibleCount < rows.length;
  const minTableWidth = `${Math.max(52, columns.length * 11)}rem`;

  if (rows.length === 0) {
    return (
      <RegistryEmptyState
        typeId={emptyTypeId}
        query={query}
        selectedTags={[]}
        onClear={onClearSearch}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3">
        <div className="flex flex-col pt-11" aria-hidden={true}>
          {visibleRows.map((row) => (
            <div key={`${getRowKey(row)}-rank`} className="flex h-14 items-center justify-center">
              <RankBadge
                rank={rankByRowKey.get(getRowKey(row)) ?? null}
                className="size-7 text-xs"
              />
            </div>
          ))}
        </div>
        <div className={CHART_CARD_FLUSH_CLASS}>
          <ScrollArea scrollbars="horizontal" className="w-full">
            <div
              className="min-w-[var(--registry-rankings-table-min-width)] xl:min-w-0"
              style={
                {
                  "--registry-rankings-table-min-width": minTableWidth,
                } as CSSProperties
              }
            >
              <Table className="table-fixed">
                <colgroup>
                  {columns.map((column) => (
                    <col key={column.id} style={{ width: column.width }} />
                  ))}
                </colgroup>
                <TableHeader>
                  <TableRow className={TABLE_HEADER_ROW_CLASS}>
                    {columns.map((column) =>
                      column.sortable ? (
                        <SortableTableHead
                          key={column.id}
                          label={column.label}
                          active={Boolean(column.active)}
                          direction={column.direction ?? "desc"}
                          onClick={column.onSort ?? (() => undefined)}
                          align={column.align}
                          accentColor={column.accentColor}
                        />
                      ) : (
                        <StaticTableHead
                          key={column.id}
                          label={column.label}
                          align={column.align}
                        />
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow key={getRowKey(row)} className="h-14 border-border/60">
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={`px-4 ${column.align === "right" ? "text-right" : ""} ${
                            column.cellClassName ?? ""
                          }`}
                        >
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </div>

      {hasMoreRows ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--registry-type-accent)] bg-[var(--registry-type-accent)] px-4 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-type-accent)_44%,transparent)]"
          >
            <Plus className="size-4" aria-hidden={true} />
            Load More
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RegistryContentTab({
  data,
  period,
  assetTypeId,
}: {
  data: RegistryAnalyticsData;
  period: RegistryAnalyticsPeriodId;
  assetTypeId: RegistryAnalyticsAssetTypeId;
}) {
  const typeConfig = getRegistryTypeConfigOrDefault(assetTypeId);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [visibleCount, setVisibleCount] = useState(CONTENT_ASSET_INCREMENT);
  const [rankingQuery, setRankingQuery] = useState("");
  const graphRows = useMemo(
    () => getGraphHistory(data.history, period).filter((row) => row.date !== "2026-03-11"),
    [data.history, period],
  );
  // The chart lags a keystroke behind the table via useDeferredValue so typing
  // stays smooth while recharts re-renders.
  const deferredRankingQuery = useDeferredValue(rankingQuery);
  const isChartFiltered = deferredRankingQuery.trim().length > 0;
  const filteredListingSeries = useMemo(() => {
    const normalizedQuery = deferredRankingQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data.listings.dailyDownloads;
    }
    return {
      dates: data.listings.dailyDownloads.dates,
      entities: data.listings.dailyDownloads.entities.filter((entity) =>
        matchesRegistrySearch(entity.searchValues ?? [entity.name, entity.id], normalizedQuery),
      ),
    };
  }, [data.listings.dailyDownloads, deferredRankingQuery]);
  // While a search is active the aggregate chart sums only the matching
  // listings, so the whole tab below the search bar reflects the filter.
  const filteredAggregateByDate = useMemo(() => {
    if (!isChartFiltered) {
      return null;
    }
    const byDate = new Map<string, number>();
    for (const entity of filteredListingSeries.entities) {
      for (const [date, point] of entity.byDate) {
        const downloads = assetTypeId === "maps" ? point.maps : point.mods;
        if (downloads > 0) {
          byDate.set(date, (byDate.get(date) ?? 0) + downloads);
        }
      }
    }
    return byDate;
  }, [assetTypeId, filteredListingSeries, isChartFiltered]);
  const chartBucketed = bucketMultiSeriesData(
    graphRows.map((row) => ({
      date: row.date,
      Downloads: filteredAggregateByDate
        ? (filteredAggregateByDate.get(row.date) ?? 0)
        : row.downloads[assetTypeId],
    })),
  );
  const chartTicks =
    period === "all-time" ? undefined : chartBucketed.data.map((point) => String(point.date));
  const hasFilterMatches = !isChartFiltered || filteredListingSeries.entities.length > 0;
  const baseRows = data.contentRankings[period][assetTypeId];
  const sortedRows = useMemo(
    () => [...baseRows].sort((left, right) => compareDownloads(left, right, sortDirection)),
    [baseRows, sortDirection],
  );
  const rankByRowKey = useMemo(
    () =>
      getSortedRankSlotMap({
        rows: sortedRows,
        direction: sortDirection,
        getKey: getContentRankingKey,
        getTieValue: (row) => row.downloads,
      }),
    [sortedRows, sortDirection],
  );
  const filteredRows = useMemo(() => {
    const normalizedQuery = rankingQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return sortedRows;
    }

    return sortedRows.filter((row) =>
      matchesRegistrySearch(
        [
          row.name,
          row.id,
          row.authorName,
          row.authorId,
          row.countryCode,
          row.countryName,
          ...buildRegistryCountrySearchValues(row.countryCode),
          ...row.searchAliases,
        ],
        normalizedQuery,
      ),
    );
  }, [rankingQuery, sortedRows]);
  const contentColumns = useMemo<RegistryRankingColumn<RegistryAnalyticsContentRanking>[]>(() => {
    const isMapRanking = assetTypeId === "maps";
    const mapColumns: RegistryRankingColumn<RegistryAnalyticsContentRanking>[] = isMapRanking
      ? [
          {
            id: "country",
            label: "Country",
            width: "10%",
            render: (row) => <CountryCell countryCode={row.countryCode} />,
          },
          {
            id: "cityCode",
            label: "City Code",
            width: "10%",
            cellClassName: "font-mono text-sm uppercase text-muted-foreground",
            render: (row) => row.cityCode || "--",
          },
        ]
      : [];

    return [
      {
        id: "name",
        label: "Name",
        width: isMapRanking ? "32%" : "42%",
        cellClassName: "font-medium text-foreground",
        render: (row) => (
          <Link
            to={getRegistryDetailUrl(row.type, row.id, "analytics")}
            className={`inline-flex max-w-full items-center gap-1.5 [--ui-link-accent:var(--registry-type-accent)] ${ACCENT_TEXT_LINK_CLASS}`}
          >
            <span className="truncate">{row.name}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
        ),
      },
      ...mapColumns,
      {
        id: "author",
        label: "Author",
        width: isMapRanking ? "28%" : "38%",
        cellClassName: "text-foreground",
        render: (row) => (
          <AnalyticsAuthorCell authorId={row.authorId} authorName={row.authorName} />
        ),
      },
      {
        id: "downloads",
        label: "Downloads",
        width: "20%",
        sortable: true,
        active: true,
        direction: sortDirection,
        align: "right" as const,
        onSort: () => setSortDirection((current) => (current === "asc" ? "desc" : "asc")),
        cellClassName: "font-semibold tabular-nums text-[var(--registry-type-accent)]",
        render: (row) => formatNumber(row.downloads),
      },
    ];
  }, [assetTypeId, sortDirection]);

  useEffect(() => {
    setVisibleCount(CONTENT_ASSET_INCREMENT);
    setSortDirection("desc");
  }, [assetTypeId, period]);

  useEffect(() => {
    setVisibleCount(CONTENT_ASSET_INCREMENT);
  }, [rankingQuery]);

  return (
    <section
      className="space-y-6"
      style={
        {
          "--registry-type-accent": `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})`,
          "--registry-toolbar-accent-light": typeConfig.accentLight,
          "--registry-type-accent-light": typeConfig.accentLight,
          "--registry-toolbar-accent-dark": typeConfig.accentDark,
          "--registry-type-accent-dark": typeConfig.accentDark,
        } as CSSProperties
      }
    >
      <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">
        <PeriodToggle
          value={period}
          onChange={(nextPeriod) =>
            navigate(getContentPath(nextPeriod, assetTypeId), {
              preserveScroll: true,
            })
          }
          className="grid-cols-2 sm:grid-cols-5"
          style={
            {
              "--registry-type-accent": "var(--suite-accent-light)",
            } as CSSProperties
          }
        />
        <RegistryTypeToggle
          activeTypeId={assetTypeId}
          counts={{
            maps: data.overview.maps.listings,
            mods: data.overview.mods.listings,
          }}
          onChange={(nextType) =>
            navigate(getContentPath(period, nextType as RegistryAnalyticsAssetTypeId), {
              preserveScroll: true,
            })
          }
          className="border-border/60 bg-card/70 shadow-sm ring-0 backdrop-blur-none"
          ariaLabel="Content asset type"
        />
      </div>

      {/* Filters everything below it: the aggregate chart, the Top chart, and the rankings. */}
      <RegistryToolbarSearch
        query={rankingQuery}
        onChange={setRankingQuery}
        placeholder={`Search ${typeConfig.pluralLabel.toLowerCase()}...`}
        inputClassName="h-12 rounded-xl bg-card/75 shadow-none"
        id={`registry-content-rankings-search-${assetTypeId}`}
      />

      <section className="space-y-3">
        <SectionSeparator
          label={isChartFiltered ? "Filtered Downloads" : "Downloads"}
          icon={Download}
          className="mb-4"
        />
        {hasFilterMatches ? (
          <MultiSeriesChartCard
            title={`${isChartFiltered ? "Filtered " : ""}${getGrainLabel(chartBucketed.grain)} Downloads`}
            chartKey={`registry-content-${assetTypeId}-${period}-${chartBucketed.grain}-${isChartFiltered ? "filtered" : "all"}`}
            data={chartBucketed.data}
            series={[
              {
                key: "Downloads",
                name: "Downloads",
                color: "var(--registry-type-accent)",
              },
            ]}
            xAxisTicks={chartTicks}
            height={280}
            stackId="content-downloads"
            ariaLabelPrefix="Content downloads chart"
          />
        ) : (
          <article className={CHART_CARD_CLASS}>
            <ChartEmptyState
              label={`No ${typeConfig.pluralLabel.toLowerCase()} match the current filters.`}
            />
          </article>
        )}
      </section>

      <section>
        <SectionSeparator
          label={`Top ${typeConfig.pluralLabel}`}
          icon={typeConfig.icon ?? FileStack}
          className="mb-4"
        />
        {/* Per-listing downloads are the flattest distribution on the site
            (the top map holds only 3-6% of its type), so share thresholds are
            meaningless here — minShare 0 selects a plain top 10. */}
        {/* Per-listing distributions are so flat that an "Others" line dwarfs
            the top entries into a band — Others renders only in the bar view
            and the pie, and the top slice caps at 8 to map 1:1 onto the
            palette. */}
        <TopEntitiesChart
          series={filteredListingSeries}
          entityKey={assetTypeId}
          period={period}
          assetType={assetTypeId}
          minShare={0}
          seriesCap={8}
          filtered={isChartFiltered}
          emptyLabel={`No ${typeConfig.pluralLabel.toLowerCase()} match the current filters.`}
          chartOthers={false}
        />
      </section>

      <section>
        <SectionSeparator label="Rankings" icon={FileStack} className="mb-4" />
        <RegistryRankingsTable
          rows={filteredRows}
          rankByRowKey={rankByRowKey}
          visibleCount={visibleCount}
          emptyTypeId={assetTypeId}
          query={rankingQuery}
          onClearSearch={() => setRankingQuery("")}
          getRowKey={getContentRankingKey}
          columns={contentColumns}
          onLoadMore={() =>
            setVisibleCount((current) =>
              Math.min(current + CONTENT_ASSET_INCREMENT, sortedRows.length),
            )
          }
        />
      </section>
    </section>
  );
}

type AuthorRankingSortKey = "downloads" | "authored" | "collaborator" | "caretaker";
type ProjectRankingSortKey = "downloads" | "maps" | "mods" | "assets";
type MapStatisticSortKey = "demand" | "pops" | "demandPoints" | "playableAreaKm2";

const AUTHOR_SORT_DEFAULTS: Record<AuthorRankingSortKey, "asc" | "desc"> = {
  downloads: "desc",
  authored: "desc",
  collaborator: "desc",
  caretaker: "desc",
};

const PROJECT_SORT_DEFAULTS: Record<ProjectRankingSortKey, "asc" | "desc"> = {
  downloads: "desc",
  maps: "desc",
  mods: "desc",
  assets: "desc",
};

const MAP_STATISTIC_SORT_DEFAULTS: Record<MapStatisticSortKey, "asc" | "desc"> = {
  demand: "desc",
  pops: "desc",
  demandPoints: "desc",
  playableAreaKm2: "desc",
};

function getAuthorRankingKey(row: RegistryAnalyticsAuthorRanking) {
  return row.id;
}

function compareAuthorRankings(
  left: RegistryAnalyticsAuthorRanking,
  right: RegistryAnalyticsAuthorRanking,
  sortKey: AuthorRankingSortKey,
  direction: "asc" | "desc",
) {
  const difference = left[sortKey] - right[sortKey];
  return direction === "asc" ? difference : -difference;
}

function getProjectRankingKey(row: RegistryAnalyticsProjectRanking) {
  return row.id;
}

function compareProjectRankings(
  left: RegistryAnalyticsProjectRanking,
  right: RegistryAnalyticsProjectRanking,
  sortKey: ProjectRankingSortKey,
  direction: "asc" | "desc",
) {
  const difference = left[sortKey] - right[sortKey];
  return direction === "asc" ? difference : -difference;
}

function getMapStatisticRankingKey(row: RegistryAnalyticsMapStatisticRanking) {
  return row.id;
}

function compareMapStatisticRankings(
  left: RegistryAnalyticsMapStatisticRanking,
  right: RegistryAnalyticsMapStatisticRanking,
  sortKey: MapStatisticSortKey,
  direction: "asc" | "desc",
) {
  const difference = left[sortKey] - right[sortKey];
  return direction === "asc" ? difference : -difference;
}

function RegistryAuthorsTab({ data }: { data: RegistryAnalyticsData }) {
  const [sortKey, setSortKey] = useState<AuthorRankingSortKey>("downloads");
  const [directions, setDirections] =
    useState<Record<AuthorRankingSortKey, "asc" | "desc">>(AUTHOR_SORT_DEFAULTS);
  const [visibleCount, setVisibleCount] = useState(AUTHOR_RANKING_INCREMENT);
  const [query, setQuery] = useState("");
  const direction = directions[sortKey];
  const chartData = data.authors.history.map((point) => ({
    date: point.date,
    Authors: point.authors,
  }));
  const sortedRows = useMemo(
    () =>
      [...data.authors.rankings].sort((left, right) =>
        compareAuthorRankings(left, right, sortKey, direction),
      ),
    [data.authors.rankings, direction, sortKey],
  );
  const rankByRowKey = useMemo(
    () =>
      getSortedRankSlotMap({
        rows: sortedRows,
        direction,
        getKey: getAuthorRankingKey,
        getTieValue: (row) => row[sortKey],
      }),
    [direction, sortKey, sortedRows],
  );
  const filteredRows = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return sortedRows;
    return sortedRows.filter((row) => matchesRegistrySearch([row.name, row.id], trimmedQuery));
  }, [query, sortedRows]);
  // Authors filter by name/id only: matching by their assets' vocabulary would
  // show total downloads under an asset-scoped query, which misleads. The
  // chart lags a keystroke behind the table via useDeferredValue.
  const deferredQuery = useDeferredValue(query);
  const isChartFiltered = deferredQuery.trim().length > 0;
  const filteredAuthorSeries = useMemo(() => {
    const trimmedQuery = deferredQuery.trim();
    if (!trimmedQuery) {
      return data.authors.dailyDownloads;
    }
    return {
      dates: data.authors.dailyDownloads.dates,
      entities: data.authors.dailyDownloads.entities.filter((entity) =>
        matchesRegistrySearch(entity.searchValues ?? [entity.name, entity.id], trimmedQuery),
      ),
    };
  }, [data.authors.dailyDownloads, deferredQuery]);

  const handleSort = (nextSortKey: AuthorRankingSortKey) => {
    setDirections((current) => ({
      ...current,
      [nextSortKey]:
        sortKey === nextSortKey
          ? current[nextSortKey] === "asc"
            ? "desc"
            : "asc"
          : current[nextSortKey],
    }));
    setSortKey(nextSortKey);
  };

  const columns = useMemo<RegistryRankingColumn<RegistryAnalyticsAuthorRanking>[]>(
    () => [
      {
        id: "author",
        label: "Author",
        width: "36%",
        cellClassName: "font-medium text-foreground",
        render: (row) => <AnalyticsAuthorCell authorId={row.id} authorName={row.name} />,
      },
      {
        id: "downloads",
        label: "Downloads",
        width: "16%",
        sortable: true,
        active: sortKey === "downloads",
        direction: directions.downloads,
        align: "right",
        accentColor: "var(--suite-accent-light)",
        onSort: () => handleSort("downloads"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "downloads" ? "text-[var(--suite-accent-light)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.downloads),
      },
      {
        id: "authored",
        label: "Authored",
        width: "16%",
        sortable: true,
        active: sortKey === "authored",
        direction: directions.authored,
        align: "right",
        accentColor: "var(--suite-accent-light)",
        onSort: () => handleSort("authored"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "authored" ? "text-[var(--suite-accent-light)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.authored),
      },
      {
        id: "collaborator",
        label: "Collaborator",
        width: "16%",
        sortable: true,
        active: sortKey === "collaborator",
        direction: directions.collaborator,
        align: "right",
        accentColor: "var(--suite-accent-light)",
        onSort: () => handleSort("collaborator"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "collaborator" ? "text-[var(--suite-accent-light)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.collaborator),
      },
      {
        id: "caretaker",
        label: "Caretaker",
        width: "16%",
        sortable: true,
        active: sortKey === "caretaker",
        direction: directions.caretaker,
        align: "right",
        accentColor: "var(--suite-accent-light)",
        onSort: () => handleSort("caretaker"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "caretaker" ? "text-[var(--suite-accent-light)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.caretaker),
      },
    ],
    [directions, sortKey],
  );

  useEffect(() => {
    setVisibleCount(AUTHOR_RANKING_INCREMENT);
  }, [query, sortKey, direction]);

  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");

  return (
    <section
      className="space-y-7"
      style={
        {
          "--registry-type-accent": "var(--suite-accent-light)",
          "--registry-toolbar-accent-light": "var(--suite-accent-light)",
          "--map-accent": `light-dark(${mapsConfig.accentLight}, ${mapsConfig.accentDark})`,
          "--mod-accent": `light-dark(${modsConfig.accentLight}, ${modsConfig.accentDark})`,
        } as CSSProperties
      }
    >
      <section>
        <SectionSeparator label="Timeline" icon={ChartLine} className="mb-4" />
        {/* Cumulative level, so the shared bucketing never applies here. */}
        <MultiSeriesChartCard
          title="Cumulative Authors"
          chartKey="registry-authors-timeline"
          data={chartData}
          series={[
            {
              key: "Authors",
              name: "Authors",
              color: "var(--suite-accent-light)",
            },
          ]}
          height={280}
          stackId="authors-timeline"
          ariaLabelPrefix="Authors timeline chart"
        />
      </section>

      {/* The Timeline above counts all authors; everything below the search
          (Top chart, pie, rankings) reflects the name/id filter. */}
      <RegistryToolbarSearch
        query={query}
        onChange={setQuery}
        placeholder="Search authors..."
        inputClassName="h-12 rounded-xl bg-card/75 shadow-none"
        id="registry-author-rankings-search"
      />

      <section>
        <SectionSeparator label="Top Authors" icon={Users} className="mb-4" />
        <TopEntitiesChart
          series={filteredAuthorSeries}
          entityKey="authors"
          filtered={isChartFiltered}
          emptyLabel="No authors match the current filters."
        />
      </section>

      <section>
        <SectionSeparator label="Rankings" icon={Trophy} className="mb-4" />
        <RegistryRankingsTable
          rows={filteredRows}
          rankByRowKey={rankByRowKey}
          visibleCount={visibleCount}
          emptyTypeId="authors"
          query={query}
          onClearSearch={() => setQuery("")}
          getRowKey={getAuthorRankingKey}
          columns={columns}
          onLoadMore={() =>
            setVisibleCount((current) =>
              Math.min(current + AUTHOR_RANKING_INCREMENT, filteredRows.length),
            )
          }
        />
      </section>
    </section>
  );
}

function RegistryProjectsTab({ data }: { data: RegistryAnalyticsData }) {
  const [sortKey, setSortKey] = useState<ProjectRankingSortKey>("downloads");
  const [directions, setDirections] =
    useState<Record<ProjectRankingSortKey, "asc" | "desc">>(PROJECT_SORT_DEFAULTS);
  const [visibleCount, setVisibleCount] = useState(AUTHOR_RANKING_INCREMENT);
  const [query, setQuery] = useState("");
  const direction = directions[sortKey];
  const sortedRows = useMemo(
    () =>
      [...data.projects.rankings].sort((left, right) =>
        compareProjectRankings(left, right, sortKey, direction),
      ),
    [data.projects.rankings, direction, sortKey],
  );
  const rankByRowKey = useMemo(
    () =>
      getSortedRankSlotMap({
        rows: sortedRows,
        direction,
        getKey: getProjectRankingKey,
        getTieValue: (row) => row[sortKey],
      }),
    [direction, sortKey, sortedRows],
  );
  const filteredRows = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return sortedRows;
    return sortedRows.filter((row) =>
      matchesRegistrySearch([row.name, row.id, row.authorName, row.authorId], trimmedQuery),
    );
  }, [query, sortedRows]);
  // The chart lags a keystroke behind the table via useDeferredValue so typing
  // stays smooth while recharts re-renders.
  const deferredQuery = useDeferredValue(query);
  const isChartFiltered = deferredQuery.trim().length > 0;
  const filteredProjectSeries = useMemo(() => {
    const trimmedQuery = deferredQuery.trim();
    if (!trimmedQuery) {
      return data.projects.dailyDownloads;
    }
    return {
      dates: data.projects.dailyDownloads.dates,
      entities: data.projects.dailyDownloads.entities.filter((entity) =>
        matchesRegistrySearch(entity.searchValues ?? [entity.name, entity.id], trimmedQuery),
      ),
    };
  }, [data.projects.dailyDownloads, deferredQuery]);

  const handleSort = (nextSortKey: ProjectRankingSortKey) => {
    setDirections((current) => ({
      ...current,
      [nextSortKey]:
        sortKey === nextSortKey
          ? current[nextSortKey] === "asc"
            ? "desc"
            : "asc"
          : current[nextSortKey],
    }));
    setSortKey(nextSortKey);
  };

  const hasMaps = data.projects.rankings.some((row) => row.maps > 0);
  const hasMods = data.projects.rankings.some((row) => row.mods > 0);
  const hasAssets = data.projects.rankings.some((row) => row.assets > 0);
  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");
  const columns = useMemo<RegistryRankingColumn<RegistryAnalyticsProjectRanking>[]>(() => {
    const nextColumns: RegistryRankingColumn<RegistryAnalyticsProjectRanking>[] = [
      {
        id: "project",
        label: "Project",
        width: hasMaps && hasMods && hasAssets ? "26%" : "38%",
        cellClassName: "font-medium text-foreground",
        render: (row) => (
          <Link
            to={`${row.href}/analytics`}
            className={`inline-flex max-w-full items-center gap-1.5 [--ui-link-accent:var(--suite-accent-light)] ${ACCENT_TEXT_LINK_CLASS}`}
          >
            <span className="truncate">{row.name}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
        ),
      },
      {
        id: "author",
        label: "Author",
        width: "18%",
        cellClassName: "font-medium text-foreground",
        render: (row) => (
          <AnalyticsAuthorCell authorId={row.authorId} authorName={row.authorName} />
        ),
      },
      {
        id: "downloads",
        label: "Downloads",
        width: "16%",
        sortable: true,
        active: sortKey === "downloads",
        direction: directions.downloads,
        align: "right",
        accentColor: "var(--suite-accent-light)",
        onSort: () => handleSort("downloads"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "downloads" ? "text-[var(--suite-accent-light)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.downloads),
      },
    ];

    if (hasMaps) {
      nextColumns.push({
        id: "maps",
        label: "Maps",
        width: "16%",
        sortable: true,
        active: sortKey === "maps",
        direction: directions.maps,
        align: "right",
        accentColor: "var(--map-accent)",
        onSort: () => handleSort("maps"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "maps" ? "text-[var(--map-accent)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.maps),
      });
    }

    if (hasMods) {
      nextColumns.push({
        id: "mods",
        label: "Mods",
        width: "16%",
        sortable: true,
        active: sortKey === "mods",
        direction: directions.mods,
        align: "right",
        accentColor: "var(--mod-accent)",
        onSort: () => handleSort("mods"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "mods" ? "text-[var(--mod-accent)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.mods),
      });
    }

    if (hasAssets) {
      nextColumns.push({
        id: "assets",
        label: "Assets",
        width: "16%",
        sortable: true,
        active: sortKey === "assets",
        direction: directions.assets,
        align: "right",
        accentColor: "var(--suite-accent-light)",
        onSort: () => handleSort("assets"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "assets" ? "text-[var(--suite-accent-light)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.assets),
      });
    }

    return nextColumns;
  }, [directions, hasAssets, hasMaps, hasMods, sortKey]);

  useEffect(() => {
    setVisibleCount(AUTHOR_RANKING_INCREMENT);
  }, [query, sortKey, direction]);

  return (
    <section
      className="space-y-7"
      style={
        {
          "--registry-type-accent": "var(--suite-accent-light)",
          "--registry-toolbar-accent-light": "var(--suite-accent-light)",
          "--map-accent": `light-dark(${mapsConfig.accentLight}, ${mapsConfig.accentDark})`,
          "--mod-accent": `light-dark(${modsConfig.accentLight}, ${modsConfig.accentDark})`,
        } as CSSProperties
      }
    >
      {/* Filters everything below it: the Top chart, the pie, and the rankings. */}
      <RegistryToolbarSearch
        query={query}
        onChange={setQuery}
        placeholder="Search projects..."
        inputClassName="h-12 rounded-xl bg-card/75 shadow-none"
        id="registry-project-rankings-search"
      />

      <section>
        <SectionSeparator label="Top Projects" icon={FolderGit2} className="mb-4" />
        {/* "No Project" holds most downloads, leaving real projects tiny
            shares of the total — minShare 0 selects a plain top 10 so up to
            nine actual projects chart alongside it. */}
        <TopEntitiesChart
          series={filteredProjectSeries}
          entityKey="projects"
          minShare={0}
          filtered={isChartFiltered}
          emptyLabel="No projects match the current filters."
        />
      </section>

      <section>
        <SectionSeparator label="Rankings" icon={Trophy} className="mb-4" />
        <RegistryRankingsTable
          rows={filteredRows}
          rankByRowKey={rankByRowKey}
          visibleCount={visibleCount}
          emptyTypeId="projects"
          query={query}
          onClearSearch={() => setQuery("")}
          getRowKey={getProjectRankingKey}
          columns={columns}
          onLoadMore={() =>
            setVisibleCount((current) =>
              Math.min(current + AUTHOR_RANKING_INCREMENT, filteredRows.length),
            )
          }
        />
      </section>
    </section>
  );
}

function CountryCell({ countryCode }: { countryCode: string }) {
  const FlagIcon = getCountryFlagIcon(countryCode);
  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm uppercase text-muted-foreground">
      {FlagIcon ? <FlagIcon className="h-3.5 w-5 rounded-[2px]" aria-hidden={true} /> : null}
      <span>{countryCode || "--"}</span>
    </span>
  );
}

function RegistryMapStatisticsTab({ data }: { data: RegistryAnalyticsData }) {
  const [sortKey, setSortKey] = useState<MapStatisticSortKey>("demand");
  const [directions, setDirections] = useState<Record<MapStatisticSortKey, "asc" | "desc">>(
    MAP_STATISTIC_SORT_DEFAULTS,
  );
  const [visibleCount, setVisibleCount] = useState(AUTHOR_RANKING_INCREMENT);
  const [query, setQuery] = useState("");
  const direction = directions[sortKey];
  const sortedRows = useMemo(
    () =>
      [...data.mapStatistics.rankings].sort((left, right) =>
        compareMapStatisticRankings(left, right, sortKey, direction),
      ),
    [data.mapStatistics.rankings, direction, sortKey],
  );
  const rankByRowKey = useMemo(
    () =>
      getSortedRankSlotMap({
        rows: sortedRows,
        direction,
        getKey: getMapStatisticRankingKey,
        getTieValue: (row) => row[sortKey],
      }),
    [direction, sortKey, sortedRows],
  );
  const filteredRows = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return sortedRows;
    return sortedRows.filter((row) =>
      matchesRegistrySearch(
        [
          row.name,
          row.id,
          row.authorName,
          row.authorId,
          row.cityCode,
          row.countryCode,
          ...buildRegistryCountrySearchValues(row.countryCode),
          ...row.searchAliases,
        ],
        trimmedQuery,
      ),
    );
  }, [query, sortedRows]);

  const handleSort = (nextSortKey: MapStatisticSortKey) => {
    setDirections((current) => ({
      ...current,
      [nextSortKey]:
        sortKey === nextSortKey
          ? current[nextSortKey] === "asc"
            ? "desc"
            : "asc"
          : current[nextSortKey],
    }));
    setSortKey(nextSortKey);
  };

  const mapConfig = getRegistryTypeConfigOrDefault("maps");
  const columns = useMemo<RegistryRankingColumn<RegistryAnalyticsMapStatisticRanking>[]>(
    () => [
      {
        id: "map",
        label: "Map",
        width: "24%",
        cellClassName: "font-medium text-foreground",
        render: (row) => (
          <Link
            to={getRegistryDetailUrl("maps", row.id, "analytics")}
            className={`inline-flex w-full min-w-0 max-w-full items-center gap-1.5 [--ui-link-accent:var(--registry-type-accent)] ${ACCENT_TEXT_LINK_CLASS}`}
          >
            <span className="truncate">{row.name}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
        ),
      },
      {
        id: "author",
        label: "Author",
        width: "13%",
        cellClassName: "min-w-0 text-foreground",
        render: (row) => (
          <AnalyticsAuthorCell authorId={row.authorId} authorName={row.authorName} />
        ),
      },
      {
        id: "country",
        label: "Country",
        width: "7%",
        render: (row) => <CountryCell countryCode={row.countryCode} />,
      },
      {
        id: "cityCode",
        label: "City Code",
        width: "7%",
        cellClassName: "font-mono text-sm uppercase text-muted-foreground",
        render: (row) => row.cityCode || "--",
      },
      {
        id: "demand",
        label: "Demand",
        width: "12%",
        sortable: true,
        active: sortKey === "demand",
        direction: directions.demand,
        align: "right",
        accentColor: "var(--registry-type-accent)",
        onSort: () => handleSort("demand"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "demand" ? "text-[var(--registry-type-accent)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.demand),
      },
      {
        id: "pops",
        label: "Pops",
        width: "10%",
        sortable: true,
        active: sortKey === "pops",
        direction: directions.pops,
        align: "right",
        accentColor: "var(--registry-type-accent)",
        onSort: () => handleSort("pops"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "pops" ? "text-[var(--registry-type-accent)]" : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.pops),
      },
      {
        id: "demandPoints",
        label: "Demand Points",
        width: "14%",
        sortable: true,
        active: sortKey === "demandPoints",
        direction: directions.demandPoints,
        align: "right",
        accentColor: "var(--registry-type-accent)",
        onSort: () => handleSort("demandPoints"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "demandPoints"
            ? "text-[var(--registry-type-accent)]"
            : "text-muted-foreground"
        }`,
        render: (row) => formatNumber(row.demandPoints),
      },
      {
        id: "playableAreaKm2",
        label: "Playable Area",
        width: "13%",
        sortable: true,
        active: sortKey === "playableAreaKm2",
        direction: directions.playableAreaKm2,
        align: "right",
        accentColor: "var(--registry-type-accent)",
        onSort: () => handleSort("playableAreaKm2"),
        cellClassName: `font-semibold tabular-nums ${
          sortKey === "playableAreaKm2"
            ? "text-[var(--registry-type-accent)]"
            : "text-muted-foreground"
        }`,
        render: (row) => `${formatNumber(row.playableAreaKm2)} km²`,
      },
    ],
    [directions, sortKey],
  );

  useEffect(() => {
    setVisibleCount(AUTHOR_RANKING_INCREMENT);
  }, [query, sortKey, direction]);

  return (
    <section
      className="space-y-7"
      style={
        {
          "--registry-type-accent": `light-dark(${mapConfig.accentLight}, ${mapConfig.accentDark})`,
          "--registry-toolbar-accent-light": mapConfig.accentLight,
          "--registry-toolbar-accent-dark": mapConfig.accentDark,
        } as CSSProperties
      }
    >
      <section>
        <SectionSeparator label="Rankings" icon={Trophy} className="mb-4" />
        <RegistryToolbarSearch
          query={query}
          onChange={setQuery}
          placeholder="Search maps..."
          className="mb-4"
          inputClassName="h-12 rounded-xl bg-card/75 shadow-none"
          id="registry-map-statistics-rankings-search"
        />
        <RegistryRankingsTable
          rows={filteredRows}
          rankByRowKey={rankByRowKey}
          visibleCount={visibleCount}
          emptyTypeId="maps"
          query={query}
          onClearSearch={() => setQuery("")}
          getRowKey={getMapStatisticRankingKey}
          columns={columns}
          onLoadMore={() =>
            setVisibleCount((current) =>
              Math.min(current + AUTHOR_RANKING_INCREMENT, filteredRows.length),
            )
          }
        />
      </section>
    </section>
  );
}

export function RegistryAnalyticsPage({
  tabId = "overview",
  periodId = "all-time",
  assetTypeId = "maps",
}: RegistryAnalyticsPageProps) {
  const suite = getSuiteById("registry");
  const navItem = getSuiteAnalyticsNavItem("registry");
  const [data, setData] = useState<RegistryAnalyticsData | null>(null);
  const [error, setError] = useState(false);
  const activeTab = TABS.some((tab) => tab.id === tabId) ? tabId : "overview";
  const HeadingIcon = (navItem?.icon ?? ChartLine) as LucideIcon;

  useEffect(() => {
    let cancelled = false;
    setError(false);
    void loadRegistryAnalyticsData()
      .then((nextData) => {
        if (!cancelled) setData(nextData);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="space-y-6 py-6 lg:py-8 [--registry-type-accent:var(--suite-accent-light)] [--registry-type-accent-strong:var(--suite-accent-light)] dark:[--registry-type-accent:var(--suite-accent-dark)] dark:[--registry-type-accent-strong:var(--suite-accent-dark)]">
        <FeatureHomepageHeading
          icon={HeadingIcon}
          title={navItem?.title ?? "Analytics"}
          suiteId="registry"
          description={navItem?.description}
          actions={[
            { label: "View Registry", href: "/registry", icon: Search },
            {
              label: "View Documentation",
              href: "/registry/docs",
              icon: BookText,
            },
          ]}
        />

        <RegistryAnalyticsTabs
          activeTab={activeTab}
          onChange={(nextTab) => navigate(TAB_PATHS[nextTab], { preserveScroll: true })}
        />

        {error ? (
          <div className="rounded-xl border border-border/70 bg-card/65 px-6 py-10 text-center text-sm font-medium text-muted-foreground">
            Registry analytics are unavailable right now.
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-border/70 bg-card/65 px-6 py-10 text-center text-sm font-medium text-muted-foreground">
            Loading analytics...
          </div>
        ) : activeTab === "overview" ? (
          <RegistryOverviewTab data={data} period={periodId} />
        ) : activeTab === "content" ? (
          <RegistryContentTab data={data} period={periodId} assetTypeId={assetTypeId} />
        ) : activeTab === "authors" ? (
          <RegistryAuthorsTab data={data} />
        ) : activeTab === "projects" ? (
          <RegistryProjectsTab data={data} />
        ) : (
          <RegistryMapStatisticsTab data={data} />
        )}
      </section>
    </SuiteAccentScope>
  );
}
