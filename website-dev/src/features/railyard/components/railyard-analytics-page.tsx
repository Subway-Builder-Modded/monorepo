import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDownToLine,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookText,
  Box,
  ChartLine,
  Download,
  GalleryVerticalEnd,
  History,
  LayoutDashboard,
  ListOrdered,
  Monitor,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SectionSeparator,
  SuiteAccentScope,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@subway-builder-modded/shared-ui";
import { AnalyticsLineChart } from "@subway-builder-modded/analytics";
import { getSuiteAnalyticsNavItem, getSuiteById } from "@/config/site-navigation";
import { navigate } from "@/lib/router";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import {
  DetailsMetricGrid,
  type DetailMetric,
} from "@/features/registry/detail/components/details-tab";
import {
  loadRailyardAnalyticsData,
  type RailyardAnalyticsData,
  type RailyardAnalyticsHistoryPoint,
} from "@/features/railyard/lib/load-railyard-analytics";
import type {
  RailyardAnalyticsPeriodId,
  RailyardAnalyticsTabId,
} from "@/features/railyard/lib/types";

type RailyardAnalyticsTab = RailyardAnalyticsTabId;
type RailyardTimelinePeriod = RailyardAnalyticsPeriodId;
type SortDirection = "asc" | "desc";
type VersionBreakdownSortKey = "version" | "downloads" | "share" | "assets";

const RAILYARD_ANALYTICS_ACCENT = "light-dark(var(--suite-accent-light), var(--suite-accent-dark))";
const VERSION_BREAKDOWN_DEFAULT_DIRECTIONS: Record<VersionBreakdownSortKey, SortDirection> = {
  version: "asc",
  downloads: "desc",
  share: "desc",
  assets: "desc",
};

type RailyardAnalyticsTabItem = {
  id: RailyardAnalyticsTab;
  label: string;
  icon: LucideIcon;
};

const TABS: RailyardAnalyticsTabItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "timeline", label: "Timeline", icon: History },
  { id: "versions", label: "Versions", icon: GalleryVerticalEnd },
  { id: "operating-systems", label: "Operating Systems", icon: Monitor },
];

const TAB_PATHS: Record<RailyardAnalyticsTab, string> = {
  overview: "/railyard/analytics/overview",
  timeline: "/railyard/analytics/timeline/all-time",
  versions: "/railyard/analytics/versions/all-time",
  "operating-systems": "/railyard/analytics/operating-systems",
};
const PERIOD_TAB_PATHS: Record<"timeline" | "versions", Record<RailyardTimelinePeriod, string>> = {
  timeline: {
    "all-time": "/railyard/analytics/timeline/all-time",
    "3d": "/railyard/analytics/timeline/3d",
    "7d": "/railyard/analytics/timeline/7d",
    "14d": "/railyard/analytics/timeline/14d",
  },
  versions: {
    "all-time": "/railyard/analytics/versions/all-time",
    "3d": "/railyard/analytics/versions/3d",
    "7d": "/railyard/analytics/versions/7d",
    "14d": "/railyard/analytics/versions/14d",
  },
};

const TIMELINE_PERIODS = [
  { id: "all-time" as const, label: "All Time", days: null },
  { id: "3d" as const, label: "Last 3 Days", days: 3 },
  { id: "7d" as const, label: "Last 7 Days", days: 7 },
  { id: "14d" as const, label: "Last 14 Days", days: 14 },
];
const GRAPH_EXCLUDED_DATES = new Set(["2026-03-30"]);

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
  })}%`;
}

function compareNumbers(left: number, right: number, direction: SortDirection) {
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

function SortableTableHead({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const SortIcon = direction === "asc" ? ArrowUp : ArrowDown;
  const Icon = active ? SortIcon : ArrowUpDown;

  return (
    <TableHead className="px-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex w-full items-center justify-start gap-1.5 text-left text-xs font-semibold uppercase leading-4 tracking-[0.12em] transition-colors hover:text-[var(--registry-type-accent)] focus-visible:outline-none ${
          active ? "text-[var(--registry-type-accent)]" : ""
        }`}
        style={active ? { color: "var(--registry-type-accent)" } : undefined}
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="uppercase">{label}</span>
        <Icon className="size-3.5 shrink-0" aria-hidden={true} />
      </button>
    </TableHead>
  );
}

const VERSION_GRAPH_PALETTE = [
  getSuiteById("registry").accent.light,
  getRegistryTypeConfigOrDefault("mods").accentLight,
  getSuiteById("template-mod").accent.light,
  getSuiteById("depot").accent.light,
  getSuiteById("railyard").accent.light,
  getRegistryTypeConfigOrDefault("maps").accentLight,
  getSuiteById("website").accent.light,
];

function parseSemver(version: string) {
  const [major = 0, minor = 0, patch = 0] = version
    .replace(/^v/i, "")
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));

  return [major, minor, patch] as const;
}

function compareSemverAscending(left: string, right: string) {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);

  for (let index = 0; index < leftParts.length; index += 1) {
    const difference = leftParts[index] - rightParts[index];
    if (difference !== 0) return difference;
  }

  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function getOperatingSystemLabel(id: string) {
  switch (id) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "linux":
      return "Linux";
    case "other":
      return "Other";
    default:
      return "—";
  }
}

function RailyardAnalyticsTabs({
  value,
  onChange,
}: {
  value: RailyardAnalyticsTab;
  onChange: (value: RailyardAnalyticsTab) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as RailyardAnalyticsTab)}>
      <TabsList
        variant="default"
        aria-label="Railyard analytics tabs"
        className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border/70 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:gap-2 sm:p-2 lg:grid-cols-4"
        style={{
          backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="h-11 min-w-0 flex-row items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 py-2 text-sm leading-tight tracking-normal text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent-strong)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_12%,var(--card))] hover:!text-[var(--registry-type-accent-strong)] dark:hover:!text-[var(--registry-type-accent-strong)] sm:px-3 data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent-strong)_60%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_18%,var(--card))] data-[state=active]:font-semibold data-[state=active]:!text-[var(--registry-type-accent-strong)]"
            >
              <Icon className="size-4 shrink-0" aria-hidden={true} />
              <span className="truncate leading-tight">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

function TimelinePeriodToggle({
  value,
  onChange,
}: {
  value: RailyardTimelinePeriod;
  onChange: (value: RailyardTimelinePeriod) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Timeline period"
      className="isolate inline-flex flex-wrap items-center justify-center gap-1 rounded-xl border border-border/50 bg-background/70 p-1 shadow-sm"
    >
      {TIMELINE_PERIODS.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.id)}
            className={`group relative flex h-9 min-w-[8.5rem] items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition-[background-color,color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "border-[color-mix(in_srgb,var(--suite-accent-light)_44%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_18%,var(--background))] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_44%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,var(--background))] dark:text-[var(--suite-accent-dark)]"
                : "border-[color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)] bg-transparent text-[var(--suite-accent-light)] hover:border-[color-mix(in_srgb,var(--suite-accent-light)_36%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,var(--background))] dark:text-[var(--suite-accent-dark)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_10%,var(--background))]"
            }`}
          >
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function aggregateRecordValues(
  rows: RailyardAnalyticsHistoryPoint[],
  key: "versions" | "operatingSystems",
) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const [id, downloads] of Object.entries(row[key])) {
      totals.set(id, (totals.get(id) ?? 0) + downloads);
    }
  }
  return [...totals.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
}

function getTimelineRows(data: RailyardAnalyticsData, period: RailyardTimelinePeriod) {
  const periodOption =
    TIMELINE_PERIODS.find((option) => option.id === period) ?? TIMELINE_PERIODS[0];
  return periodOption.days ? data.history.slice(-periodOption.days) : data.history;
}

function getTimelineGraphRows(data: RailyardAnalyticsData, period: RailyardTimelinePeriod) {
  const periodOption =
    TIMELINE_PERIODS.find((option) => option.id === period) ?? TIMELINE_PERIODS[0];
  const graphDays =
    periodOption.days && (period === "3d" || period === "7d")
      ? periodOption.days + 1
      : periodOption.days;
  const rows = graphDays ? data.history.slice(-graphDays) : data.history;
  return rows.filter((row) => !GRAPH_EXCLUDED_DATES.has(row.date));
}

function RailyardTimelineTab({
  data,
  period,
}: {
  data: RailyardAnalyticsData;
  period: RailyardTimelinePeriod;
}) {
  const rows = useMemo(() => getTimelineRows(data, period), [data, period]);
  const graphRows = useMemo(() => getTimelineGraphRows(data, period), [data, period]);
  const topVersion = useMemo(() => aggregateRecordValues(rows, "versions"), [rows]);
  const topOperatingSystem = useMemo(() => aggregateRecordValues(rows, "operatingSystems"), [rows]);
  const downloads = rows.reduce((sum, row) => sum + row.downloads, 0);
  const cards: DetailMetric[] = [
    {
      title: "Downloads",
      value: formatNumber(downloads),
      icon: Download,
    },
    {
      title: "Top Version",
      value: topVersion?.[0] ?? "\u2014",
      icon: Package,
    },
    {
      title: "Top Operating System",
      value: topOperatingSystem ? getOperatingSystemLabel(topOperatingSystem[0]) : "\u2014",
      icon: Monitor,
    },
  ];
  const chartData = graphRows.map((row) => ({
    date: row.date,
    Downloads: row.downloads,
  }));
  const chartTicks = period === "all-time" ? undefined : chartData.map((point) => point.date);

  return (
    <section
      className="space-y-4"
      style={{ "--registry-type-accent": RAILYARD_ANALYTICS_ACCENT } as CSSProperties}
    >
      <SectionSeparator label="Timeline" icon={History} className="mb-4" />
      <div className="flex justify-center">
        <TimelinePeriodToggle
          value={period}
          onChange={(nextPeriod) => navigate(PERIOD_TAB_PATHS.timeline[nextPeriod])}
        />
      </div>
      <DetailsMetricGrid
        className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        items={cards}
        accentLight="var(--suite-accent-light)"
        accentDark="var(--suite-accent-dark)"
      />
      <article className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
        <AnalyticsLineChart
          key={`railyard-timeline-${period}`}
          data={chartData}
          lines={[
            {
              key: "Downloads",
              name: "Downloads",
              color: RAILYARD_ANALYTICS_ACCENT,
            },
          ]}
          xAxisKey="date"
          xAxisTicks={chartTicks}
          height={240}
          startAtZero={true}
        />
      </article>
    </section>
  );
}

type VersionBreakdownRow = {
  version: string;
  downloads: number;
  share: number;
  assets: number;
};

function buildVersionBreakdownRows(data: RailyardAnalyticsData): VersionBreakdownRow[] {
  const totalDownloads = data.overview.totalDownloads;
  return [...data.versions]
    .sort((left, right) => right.totalDownloads - left.totalDownloads)
    .map((version) => ({
      version: version.version,
      downloads: version.totalDownloads,
      share: totalDownloads > 0 ? (version.totalDownloads / totalDownloads) * 100 : 0,
      assets: Object.keys(version.assets).length,
    }));
}

function RailyardVersionsBreakdown({ data }: { data: RailyardAnalyticsData }) {
  const rows = useMemo(() => buildVersionBreakdownRows(data), [data]);
  const [sortKey, setSortKey] = useState<VersionBreakdownSortKey>("downloads");
  const [directions, setDirections] = useState<Record<VersionBreakdownSortKey, SortDirection>>(
    VERSION_BREAKDOWN_DEFAULT_DIRECTIONS,
  );
  const direction = directions[sortKey];
  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      if (sortKey === "version") {
        const comparison = compareSemverAscending(left.version, right.version);
        return direction === "asc" ? comparison : -comparison;
      }

      return compareNumbers(left[sortKey], right[sortKey], direction);
    });
  }, [direction, rows, sortKey]);

  const handleSort = (nextKey: VersionBreakdownSortKey) => {
    setDirections((current) => ({
      ...current,
      [nextKey]: getNextDirection(sortKey, nextKey, current),
    }));
    setSortKey(nextKey);
  };

  if (rows.length === 0) return null;

  return (
    <div>
      <SectionSeparator label="Breakdown" icon={ListOrdered} className="mb-4 mt-7" />
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
        <Table>
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <TableHeader>
            <TableRow className="border-border/70 bg-muted/35 hover:bg-muted/35">
              <SortableTableHead
                label="Version"
                active={sortKey === "version"}
                direction={direction}
                onClick={() => handleSort("version")}
              />
              <SortableTableHead
                label="Downloads"
                active={sortKey === "downloads"}
                direction={direction}
                onClick={() => handleSort("downloads")}
              />
              <SortableTableHead
                label="Share"
                active={sortKey === "share"}
                direction={direction}
                onClick={() => handleSort("share")}
              />
              <SortableTableHead
                label="Assets"
                active={sortKey === "assets"}
                direction={direction}
                onClick={() => handleSort("assets")}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.version} className="border-border/60 hover:bg-transparent">
                <TableCell
                  className="px-4 font-medium text-foreground"
                  style={
                    sortKey === "version" ? { color: "var(--registry-type-accent)" } : undefined
                  }
                >
                  {row.version}
                </TableCell>
                <TableCell
                  className="px-4 font-semibold tabular-nums text-foreground"
                  style={
                    sortKey === "downloads" ? { color: "var(--registry-type-accent)" } : undefined
                  }
                >
                  {formatNumber(row.downloads)}
                </TableCell>
                <TableCell
                  className="px-4 font-semibold tabular-nums text-foreground"
                  style={sortKey === "share" ? { color: "var(--registry-type-accent)" } : undefined}
                >
                  {formatPercent(row.share)}
                </TableCell>
                <TableCell
                  className="px-4 font-semibold tabular-nums text-foreground"
                  style={
                    sortKey === "assets" ? { color: "var(--registry-type-accent)" } : undefined
                  }
                >
                  {formatNumber(row.assets)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RailyardVersionsTab({
  data,
  period,
}: {
  data: RailyardAnalyticsData;
  period: RailyardTimelinePeriod;
}) {
  const graphRows = useMemo(() => getTimelineGraphRows(data, period), [data, period]);
  const versions = useMemo(
    () =>
      [...data.versions].sort((left, right) => compareSemverAscending(left.version, right.version)),
    [data.versions],
  );
  const visibleVersions = useMemo(
    () =>
      versions.filter((version) =>
        graphRows.some((row) => (row.versions[version.version] ?? 0) > 0),
      ),
    [graphRows, versions],
  );
  const versionColorByName = useMemo(
    () =>
      new Map(
        versions.map((version, index) => [
          version.version,
          VERSION_GRAPH_PALETTE[index % VERSION_GRAPH_PALETTE.length],
        ]),
      ),
    [versions],
  );
  const versionGraphLines = useMemo(() => {
    return visibleVersions.map((version) => ({
      key: version.version,
      name: version.version,
      color: versionColorByName.get(version.version),
    }));
  }, [versionColorByName, visibleVersions]);
  const chartData = graphRows.map((row) => {
    const point: Record<string, string | number> = { date: row.date };
    for (const version of visibleVersions) {
      point[version.version] = row.versions[version.version] ?? 0;
    }
    return point;
  });
  const chartTicks = period === "all-time" ? undefined : chartData.map((point) => point.date);

  return (
    <section
      className="space-y-4"
      style={{ "--registry-type-accent": RAILYARD_ANALYTICS_ACCENT } as CSSProperties}
    >
      <SectionSeparator label="Versions" icon={GalleryVerticalEnd} className="mb-4" />
      <div className="flex justify-center">
        <TimelinePeriodToggle
          value={period}
          onChange={(nextPeriod) => navigate(PERIOD_TAB_PATHS.versions[nextPeriod])}
        />
      </div>
      <article className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
        <AnalyticsLineChart
          key={`railyard-versions-${period}`}
          data={chartData}
          lines={versionGraphLines}
          xAxisKey="date"
          xAxisTicks={chartTicks}
          height={280}
          startAtZero={true}
          hideZeroTooltipEntries={true}
        />
      </article>
      <RailyardVersionsBreakdown data={data} />
    </section>
  );
}

function buildOverviewCards(data: RailyardAnalyticsData): DetailMetric[] {
  const { overview } = data;

  return [
    {
      title: "Downloads (Total)",
      value: formatNumber(overview.totalDownloads),
      icon: Download,
    },
    {
      title: "Downloads (Last Day)",
      value: formatNumber(overview.lastDayDownloads),
      icon: ArrowDownToLine,
    },
    {
      title: "Versions",
      value: formatNumber(overview.versionCount),
      icon: GalleryVerticalEnd,
    },
    {
      title: "Build Assets",
      value: formatNumber(overview.buildAssetCount),
      icon: Box,
    },
    {
      title: "Top Version",
      value: overview.topVersion?.version ?? "\u2014",
      icon: Package,
    },
    {
      title: "Top Operating System",
      value: overview.topOperatingSystem?.label ?? "\u2014",
      icon: Monitor,
    },
  ];
}

function RailyardOverviewTab({ data }: { data: RailyardAnalyticsData }) {
  const cards = useMemo(() => buildOverviewCards(data), [data]);

  return (
    <section
      className="space-y-3"
      style={{ "--registry-type-accent": RAILYARD_ANALYTICS_ACCENT } as CSSProperties}
    >
      <div>
        <SectionSeparator label="Overview" icon={LayoutDashboard} className="mb-4" />
        <DetailsMetricGrid
          className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          items={cards}
          accentLight="var(--suite-accent-light)"
          accentDark="var(--suite-accent-dark)"
        />
      </div>
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

export function RailyardAnalyticsPage({
  tabId = "overview",
  periodId = "all-time",
}: {
  tabId?: RailyardAnalyticsTab;
  periodId?: RailyardTimelinePeriod;
}) {
  const suite = getSuiteById("railyard");
  const navItem = getSuiteAnalyticsNavItem("railyard");
  const [data, setData] = useState<RailyardAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeTab = tabId;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    void loadRailyardAnalyticsData()
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const headingActions = [
    { label: "Download", href: "/railyard", icon: Download },
    { label: "View Documentation", href: "/railyard/docs", icon: BookText },
    { label: "View Updates", href: "/railyard/updates", icon: GalleryVerticalEnd },
  ];

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section
        className="space-y-6 py-6 lg:py-8"
        style={
          {
            "--registry-type-accent": RAILYARD_ANALYTICS_ACCENT,
            "--registry-type-accent-strong": RAILYARD_ANALYTICS_ACCENT,
          } as CSSProperties
        }
      >
        <FeatureHomepageHeading
          icon={ChartLine}
          title={navItem?.title ?? "Analytics"}
          description={navItem?.description}
          suiteId="railyard"
          actions={headingActions}
        />

        <RailyardAnalyticsTabs
          value={activeTab}
          onChange={(nextTab) => navigate(TAB_PATHS[nextTab])}
        />

        {isLoading ? (
          <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/55 px-6 text-sm font-medium text-muted-foreground">
            Loading analytics...
          </div>
        ) : !data ? (
          <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/55 px-6 text-center text-sm font-medium text-muted-foreground">
            Railyard analytics are unavailable right now.
          </div>
        ) : activeTab === "overview" ? (
          <RailyardOverviewTab data={data} />
        ) : activeTab === "timeline" ? (
          <RailyardTimelineTab data={data} period={periodId} />
        ) : activeTab === "versions" ? (
          <RailyardVersionsTab data={data} period={periodId} />
        ) : (
          <PendingTab label="Operating Systems" icon={Monitor} />
        )}
      </section>
    </SuiteAccentScope>
  );
}
