import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  BookText,
  ChartLine,
  ChartPie,
  Download,
  ExternalLink,
  FileStack,
  LayoutDashboard,
  Map,
  Package,
  Plus,
  Search,
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
  getSortedRankSlotMap,
} from "@subway-builder-modded/shared-ui";
import { AnalyticsLineChart, AnalyticsPieChart } from "@subway-builder-modded/analytics";
import type { PieSlice } from "@subway-builder-modded/analytics";
import { getSuiteAnalyticsNavItem, getSuiteById } from "@/config/site-navigation";
import { Link, navigate } from "@/lib/router";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import { RegistryEmptyState } from "@/features/registry/components/browse/registry-empty-state";
import { RegistrySearch } from "@/features/registry/components/registry-search";
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
  type RegistryAnalyticsContentRanking,
  type RegistryAnalyticsData,
  type RegistryAnalyticsPeriodId,
} from "@/features/registry/analytics/lib/load-registry-analytics";

export type RegistryAnalyticsTabId = "overview" | "content" | "authors" | "map-statistics";

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
  { id: "map-statistics", label: "Map Statistics", icon: Map },
];

const TAB_PATHS: Record<RegistryAnalyticsTabId, string> = {
  overview: "/registry/analytics/overview/all-time",
  content: "/registry/analytics/content/all-time/maps",
  authors: "/registry/analytics/authors",
  "map-statistics": "/registry/analytics/map-statistics",
};

const OVERVIEW_PERIOD_PATHS: Record<RegistryAnalyticsPeriodId, string> = {
  "all-time": "/registry/analytics/overview/all-time",
  "3d": "/registry/analytics/overview/3d",
  "7d": "/registry/analytics/overview/7d",
  "14d": "/registry/analytics/overview/14d",
};

const CONTENT_ASSET_INCREMENT = 20;

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

function getContentPath(period: RegistryAnalyticsPeriodId, assetTypeId: RegistryAnalyticsAssetTypeId) {
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
    <Tabs value={activeTab} onValueChange={(value) => onChange(value as RegistryAnalyticsTabId)}>
      <TabsList
        aria-label="Registry analytics tabs"
        className="grid !h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border/60 bg-card/65 p-1.5 sm:grid-cols-4"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="!h-11 min-w-0 flex-row items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 py-2 text-sm leading-tight tracking-normal text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent-strong)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_12%,var(--card))] hover:!text-[var(--registry-type-accent-strong)] dark:hover:!text-[var(--registry-type-accent-strong)] sm:px-3 data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent-strong)_60%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_18%,var(--card))] data-[state=active]:font-semibold data-[state=active]:!text-[var(--registry-type-accent-strong)]"
            >
              <Icon className="size-4 shrink-0" aria-hidden={true} />
              <span className="truncate">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
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

function ContentAssetTypeToggle({
  value,
  data,
  onChange,
}: {
  value: RegistryAnalyticsAssetTypeId;
  data: RegistryAnalyticsData;
  onChange: (assetTypeId: RegistryAnalyticsAssetTypeId) => void;
}) {
  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");
  const options = [
    {
      id: "maps" as const,
      label: "Maps",
      count: data.overview.maps.listings,
      icon: Map,
      color: mapsConfig.accentLight,
    },
    {
      id: "mods" as const,
      label: "Mods",
      count: data.overview.mods.listings,
      icon: Package,
      color: modsConfig.accentLight,
    },
  ];

  return (
    <Tabs value={value} onValueChange={(nextValue) => onChange(nextValue as RegistryAnalyticsAssetTypeId)}>
      <TabsList className="grid !h-auto grid-cols-2 gap-1 rounded-xl border border-border/60 bg-card/70 p-1">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <TabsTrigger
              key={option.id}
              value={option.id}
              className="!h-10 min-w-0 justify-center rounded-lg border border-transparent px-3 text-sm font-semibold transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent)_12%,var(--card))] hover:!text-[var(--registry-type-accent)] data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent)_62%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent)_18%,var(--card))] data-[state=active]:!text-[var(--registry-type-accent)]"
              style={{ "--registry-type-accent": option.color, color: option.color } as CSSProperties}
            >
              <span className="inline-flex min-w-0 items-center justify-center gap-1.5">
                <Icon className="size-4 shrink-0" aria-hidden={true} />
                <span>{option.label}</span>
                <span className="rounded-md border border-current/25 px-1.5 py-0.5 text-xs tabular-nums">
                  {formatNumber(option.count)}
                </span>
              </span>
            </TabsTrigger>
          );
        })}
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

      <div className="flex justify-center">
        <PeriodToggle
          value={period}
          onChange={(nextPeriod) => navigate(OVERVIEW_PERIOD_PATHS[nextPeriod])}
        />
      </div>

      <section className="space-y-3">
        <SectionSeparator label="Downloads" icon={ChartLine} className="mb-4" />
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

function ContentRankingsTable({
  rows,
  rankByRowKey,
  direction,
  visibleCount,
  assetTypeId,
  query,
  onClearSearch,
  onSortToggle,
  onLoadMore,
}: {
  rows: RegistryAnalyticsContentRanking[];
  rankByRowKey: Map<string, number | null>;
  direction: "asc" | "desc";
  visibleCount: number;
  assetTypeId: RegistryAnalyticsAssetTypeId;
  query: string;
  onClearSearch: () => void;
  onSortToggle: () => void;
  onLoadMore: () => void;
}) {
  const visibleRows = rows.slice(0, visibleCount);
  const hasMoreRows = visibleCount < rows.length;

  if (rows.length === 0) {
    return (
      <RegistryEmptyState
        typeId={assetTypeId}
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
            <div
              key={`${row.type}-${row.id}-rank`}
              className="flex h-14 items-center justify-center"
            >
              <RankBadge
                rank={rankByRowKey.get(getContentRankingKey(row)) ?? null}
                className="size-7 text-xs"
              />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
          <Table>
            <colgroup>
              <col className="w-[45%]" />
              <col className="w-[35%]" />
              <col className="w-[20%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="border-border/70 bg-muted/35 hover:bg-muted/35">
                <StaticTableHead label="Name" />
                <StaticTableHead label="Author" />
                <SortableTableHead
                  label="Downloads"
                  active={true}
                  direction={direction}
                  onClick={onSortToggle}
                  align="right"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={`${row.type}-${row.id}`} className="h-14 border-border/60">
                  <TableCell className="px-4 font-medium text-foreground">
                    <Link
                      to={getRegistryDetailUrl(row.type, row.id)}
                      className="inline-flex max-w-full items-center gap-1.5 transition-colors hover:text-[var(--registry-type-accent)] hover:underline hover:decoration-current hover:underline-offset-4"
                    >
                      <span className="truncate">{row.name}</span>
                      <ExternalLink
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden={true}
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 text-foreground">
                    <Link
                      to={getRegistryAuthorUrl(row.authorId)}
                      className="inline-flex max-w-full items-center gap-1.5 transition-colors hover:text-[var(--suite-accent-light)] hover:underline hover:decoration-current hover:underline-offset-4"
                    >
                      <span className="truncate">{row.authorName}</span>
                      <ExternalLink
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden={true}
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 text-right font-semibold tabular-nums text-[var(--registry-type-accent)]">
                    {formatNumber(row.downloads)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    () =>
      getGraphHistory(data.history, period).filter(
        (row) => row.date !== "2026-03-11",
      ),
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
          "--registry-type-accent": typeConfig.accentLight,
          "--registry-type-accent-light": typeConfig.accentLight,
          "--registry-type-accent-dark": typeConfig.accentDark,
        } as CSSProperties
      }
    >
      <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">
        <PeriodToggle
          value={period}
          onChange={(nextPeriod) => navigate(getContentPath(nextPeriod, assetTypeId))}
          className="grid-cols-2 sm:grid-cols-4"
          style={
            {
              "--registry-type-accent": "var(--suite-accent-light)",
            } as CSSProperties
          }
        />
        <ContentAssetTypeToggle
          value={assetTypeId}
          data={data}
          onChange={(nextType) => navigate(getContentPath(period, nextType))}
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
        <RegistrySearch
          query={rankingQuery}
          onChange={setRankingQuery}
          placeholder={`Search ${typeConfig.pluralLabel.toLowerCase()}...`}
          className="mb-4"
          inputClassName="h-12 rounded-xl bg-card/75 shadow-none focus-visible:border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          id={`registry-content-rankings-search-${assetTypeId}`}
        />
        <ContentRankingsTable
          rows={filteredRows}
          rankByRowKey={rankByRowKey}
          direction={sortDirection}
          visibleCount={visibleCount}
          assetTypeId={assetTypeId}
          query={rankingQuery}
          onClearSearch={() => setRankingQuery("")}
          onSortToggle={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
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

function PendingTab({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div>
      <SectionSeparator label={label} icon={Icon} className="mb-4" />
      <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/55 px-6 text-center text-sm font-medium text-muted-foreground">
        {label} analytics are coming next.
      </div>
    </div>
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
          onChange={(nextTab) => navigate(TAB_PATHS[nextTab])}
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
          <PendingTab label="Authors" icon={Users} />
        ) : (
          <PendingTab label="Map Statistics" icon={Map} />
        )}
      </section>
    </SuiteAccentScope>
  );
}
