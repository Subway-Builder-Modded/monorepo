import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  BookText,
  ChartLine,
  ChartPie,
  Clock,
  Download,
  ExternalLink,
  FileStack,
  FolderGit2,
  LayoutDashboard,
  Map,
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
  Tabs,
  TabsList,
  TabsTrigger,
  RankBadge,
  ScrollArea,
  getSortedRankSlotMap,
} from "@subway-builder-modded/shared-ui";
import {
  AnalyticsLineChart,
  AnalyticsPieChart,
  AnalyticsStackedBarChart,
} from "@subway-builder-modded/analytics";
import type { PieSlice } from "@subway-builder-modded/analytics";
import { getSuiteAnalyticsNavItem, getSuiteById } from "@/config/site-navigation";
import { getCountryFlagIcon } from "@/lib/country-flags";
import { Link, navigate } from "@/lib/router";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import { RegistryEmptyState } from "@/features/registry/components/browse/registry-empty-state";
import { RegistryTabs } from "@/features/registry/components/registry-tabs";
import { RegistryToolbarSearch } from "@/features/registry/components/registry-toolbar-search";
import { RegistryTypeToggle } from "@/features/registry/components/registry-type-toggle";
import {
  DetailsMetricGrid,
  type DetailMetric,
} from "@/features/registry/detail/components/details-tab";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import { getRegistryAuthorUrl, getRegistryDetailUrl } from "@/features/registry/lib/routing";
import {
  filterRegistryAnalyticsHistory,
  loadRegistryAnalyticsData,
  sumRegistryAnalyticsHistory,
  type RegistryAnalyticsAssetTypeId,
  type RegistryAnalyticsAuthorRanking,
  type RegistryAnalyticsContentRanking,
  type RegistryAnalyticsData,
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
  { id: "map-statistics", label: "Map Statistics", icon: Map },
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
};

const CONTENT_ASSET_INCREMENT = 20;
const AUTHOR_RANKING_INCREMENT = 20;

const PERIODS = [
  { id: "all-time" as const, label: "All Time" },
  { id: "3d" as const, label: "Last 3 Days" },
  { id: "7d" as const, label: "Last 7 Days" },
  { id: "14d" as const, label: "Last 14 Days" },
];

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

function PeriodToggle({
  value,
  onChange,
  className = "grid-cols-2 sm:grid-cols-4",
  style,
}: {
  value: RegistryAnalyticsPeriodId;
  onChange: (period: RegistryAnalyticsPeriodId) => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as RegistryAnalyticsPeriodId)}
      style={style}
    >
      <TabsList
        className={`grid !h-auto gap-1 rounded-xl border border-border/60 bg-card/70 p-1 ${className}`}
      >
        {PERIODS.map((period) => (
          <TabsTrigger
            key={period.id}
            value={period.id}
            className="!h-10 min-w-0 justify-center rounded-lg border border-transparent px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent)_12%,var(--card))] hover:!text-[var(--registry-type-accent)] data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent)_62%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent)_18%,var(--card))] data-[state=active]:!text-[var(--registry-type-accent)]"
          >
            {period.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function RegistryPieChartCard({
  title,
  icon: Icon,
  data,
}: {
  title: string;
  icon: LucideIcon;
  data: PieSlice[];
}) {
  return (
    <article className="min-h-[22rem] rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden={true} />
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h3>
      </div>
      <AnalyticsPieChart data={data} height={250} />
    </article>
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
  const chartData = graphRows.map((row) => ({
    date: row.date,
    Total: row.downloads.total,
    Maps: row.downloads.maps,
    Mods: row.downloads.mods,
  }));
  const cumulativeChartData = data.history.map((row) => ({
    date: row.date,
    Maps: row.cumulativeDownloads.maps,
    Mods: row.cumulativeDownloads.mods,
  }));
  const chartTicks = period === "all-time" ? undefined : chartData.map((point) => point.date);
  const breakdown = buildPeriodBreakdown(data, period);
  const listingSlices: PieSlice[] = [
    {
      key: "maps",
      name: "Maps",
      value: breakdown.listings.maps,
      color: "var(--registry-maps-accent)",
    },
    {
      key: "mods",
      name: "Mods",
      value: breakdown.listings.mods,
      color: "var(--registry-mods-accent)",
    },
  ];
  const downloadSlices: PieSlice[] = [
    {
      key: "maps",
      name: "Maps",
      value: breakdown.downloads.maps,
      color: "var(--registry-maps-accent)",
    },
    {
      key: "mods",
      name: "Mods",
      value: breakdown.downloads.mods,
      color: "var(--registry-mods-accent)",
    },
  ];

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
        <article className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
          <AnalyticsStackedBarChart
            key="registry-cumulative-downloads-all-time"
            data={cumulativeChartData}
            bars={[
              { key: "Maps", name: "Maps", color: "var(--registry-maps-accent)" },
              { key: "Mods", name: "Mods", color: "var(--registry-mods-accent)" },
            ]}
            xAxisKey="date"
            height={280}
          />
        </article>
      </section>

      <div className="flex justify-center">
        <PeriodToggle
          value={period}
          onChange={(nextPeriod) =>
            navigate(OVERVIEW_PERIOD_PATHS[nextPeriod], { preserveScroll: true })
          }
        />
      </div>

      <section className="space-y-3">
        <SectionSeparator label="Downloads Timeline" icon={Clock} className="mb-4" />
        <article className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
          <AnalyticsLineChart
            key={`registry-downloads-${period}`}
            data={chartData}
            lines={[
              { key: "Maps", name: "Maps", color: "var(--registry-maps-accent)" },
              { key: "Mods", name: "Mods", color: "var(--registry-mods-accent)" },
              { key: "Total", name: "Total", color: "var(--registry-type-accent)" },
            ]}
            xAxisKey="date"
            xAxisTicks={chartTicks}
            height={280}
            startAtZero={true}
          />
        </article>
      </section>

      <section>
        <SectionSeparator label="Breakdown" icon={ChartPie} className="mb-4" />
        <div className="grid gap-4 lg:grid-cols-2">
          <RegistryPieChartCard
            title={period === "all-time" ? "Listings" : "New Listings"}
            icon={FileStack}
            data={listingSlices}
          />
          <RegistryPieChartCard title="Downloads" icon={ChartPie} data={downloadSlices} />
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
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
          <ScrollArea scrollbars="horizontal" className="w-full pb-2">
            <div
              className="min-w-[var(--registry-rankings-table-min-width)] xl:min-w-0"
              style={{ "--registry-rankings-table-min-width": minTableWidth } as CSSProperties}
            >
              <Table className="table-fixed">
                <colgroup>
                  {columns.map((column) => (
                    <col key={column.id} style={{ width: column.width }} />
                  ))}
                </colgroup>
                <TableHeader>
                  <TableRow className="border-border/70 bg-muted/35 hover:bg-muted/35">
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
  const chartData = graphRows.map((row) => ({
    date: row.date,
    Downloads: row.downloads[assetTypeId],
  }));
  const chartTicks = period === "all-time" ? undefined : chartData.map((point) => point.date);
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
      `${row.name} ${row.authorName}`.toLowerCase().includes(normalizedQuery),
    );
  }, [rankingQuery, sortedRows]);
  const contentColumns = useMemo<RegistryRankingColumn<RegistryAnalyticsContentRanking>[]>(
    () => [
      {
        id: "name",
        label: "Name",
        width: "45%",
        cellClassName: "font-medium text-foreground",
        render: (row) => (
          <Link
            to={getRegistryDetailUrl(row.type, row.id, "analytics")}
            className="inline-flex max-w-full items-center gap-1.5 transition-colors hover:text-[var(--registry-type-accent)] hover:underline hover:decoration-current hover:underline-offset-4"
          >
            <span className="truncate">{row.name}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
        ),
      },
      {
        id: "author",
        label: "Author",
        width: "35%",
        cellClassName: "text-foreground",
        render: (row) => (
          <Link
            to={getRegistryAuthorUrl(row.authorId, "analytics")}
            className="inline-flex max-w-full items-center gap-1.5 transition-colors hover:text-[var(--suite-accent-light)] hover:underline hover:decoration-current hover:underline-offset-4"
          >
            <span className="truncate">{row.authorName}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
        ),
      },
      {
        id: "downloads",
        label: "Downloads",
        width: "20%",
        sortable: true,
        active: true,
        direction: sortDirection,
        align: "right",
        onSort: () => setSortDirection((current) => (current === "asc" ? "desc" : "asc")),
        cellClassName: "font-semibold tabular-nums text-[var(--registry-type-accent)]",
        render: (row) => formatNumber(row.downloads),
      },
    ],
    [sortDirection],
  );

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
            navigate(getContentPath(nextPeriod, assetTypeId), { preserveScroll: true })
          }
          className="grid-cols-2 sm:grid-cols-4"
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

      <section className="space-y-3">
        <SectionSeparator label="Downloads" icon={Download} className="mb-4" />
        <article className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
          <AnalyticsLineChart
            key={`registry-content-${assetTypeId}-${period}`}
            data={chartData}
            lines={[
              {
                key: "Downloads",
                name: "Downloads",
                color: "var(--registry-type-accent)",
              },
            ]}
            xAxisKey="date"
            xAxisTicks={chartTicks}
            height={280}
            startAtZero={true}
          />
        </article>
      </section>

      <section>
        <SectionSeparator label="Rankings" icon={FileStack} className="mb-4" />
        <RegistryToolbarSearch
          query={rankingQuery}
          onChange={setRankingQuery}
          placeholder={`Search ${typeConfig.pluralLabel.toLowerCase()}...`}
          className="mb-4"
          inputClassName="h-12 rounded-xl bg-card/75 shadow-none"
          id={`registry-content-rankings-search-${assetTypeId}`}
        />
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

type AuthorRankingSortKey = "downloads" | "maps" | "mods" | "assets";
type ProjectRankingSortKey = "downloads" | "maps" | "mods" | "assets";
type MapStatisticSortKey = "demand" | "pops" | "demandPoints" | "playableAreaKm2";

const AUTHOR_SORT_DEFAULTS: Record<AuthorRankingSortKey, "asc" | "desc"> = {
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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedRows;
    return sortedRows.filter((row) =>
      `${row.name} ${row.id}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query, sortedRows]);

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
        render: (row) => (
          <Link
            to={getRegistryAuthorUrl(row.id, "analytics")}
            className="inline-flex max-w-full items-center gap-1.5 transition-colors hover:text-[var(--suite-accent-light)] hover:underline hover:decoration-current hover:underline-offset-4"
          >
            <span className="truncate">{row.name}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
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
      {
        id: "maps",
        label: "Maps Published",
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
      },
      {
        id: "mods",
        label: "Mods Published",
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
      },
      {
        id: "assets",
        label: "Assets Published",
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
        <article className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
          <AnalyticsLineChart
            key="registry-authors-timeline"
            data={chartData}
            lines={[
              {
                key: "Authors",
                name: "Authors",
                color: "var(--suite-accent-light)",
              },
            ]}
            xAxisKey="date"
            height={280}
            startAtZero={true}
          />
        </article>
      </section>

      <section>
        <SectionSeparator label="Rankings" icon={Trophy} className="mb-4" />
        <RegistryToolbarSearch
          query={query}
          onChange={setQuery}
          placeholder="Search authors..."
          className="mb-4"
          inputClassName="h-12 rounded-xl bg-card/75 shadow-none"
          id="registry-author-rankings-search"
        />
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
    useState<Record<ProjectRankingSortKey, "asc" | "desc">>(AUTHOR_SORT_DEFAULTS);
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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedRows;
    return sortedRows.filter((row) =>
      `${row.name} ${row.id}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query, sortedRows]);

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
        width: hasMaps && hasMods && hasAssets ? "36%" : "52%",
        cellClassName: "font-medium text-foreground",
        render: (row) => (
          <Link
            to={`${row.href}/analytics`}
            className="inline-flex max-w-full items-center gap-1.5 transition-colors hover:text-[var(--suite-accent-light)] hover:underline hover:decoration-current hover:underline-offset-4"
          >
            <span className="truncate">{row.name}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
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
      <section>
        <SectionSeparator label="Rankings" icon={Trophy} className="mb-4" />
        <RegistryToolbarSearch
          query={query}
          onChange={setQuery}
          placeholder="Search projects..."
          className="mb-4"
          inputClassName="h-12 rounded-xl bg-card/75 shadow-none"
          id="registry-project-rankings-search"
        />
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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedRows;
    return sortedRows.filter((row) =>
      `${row.name} ${row.authorName} ${row.cityCode} ${row.countryCode}`
        .toLowerCase()
        .includes(normalizedQuery),
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
            className="inline-flex w-full min-w-0 max-w-full items-center gap-1.5 transition-colors hover:text-[var(--registry-type-accent)] hover:underline hover:decoration-current hover:underline-offset-4"
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
          <Link
            to={getRegistryAuthorUrl(row.authorId, "analytics")}
            className="inline-flex w-full min-w-0 max-w-full items-center gap-1.5 transition-colors hover:text-[var(--suite-accent-light)] hover:underline hover:decoration-current hover:underline-offset-4"
            title={row.authorName}
          >
            <span className="truncate">{row.authorName}</span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          </Link>
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
            { label: "View Documentation", href: "/registry/docs", icon: BookText },
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
