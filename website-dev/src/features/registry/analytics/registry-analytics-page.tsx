import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  BookText,
  ChartLine,
  ChartPie,
  FileStack,
  LayoutDashboard,
  Map,
  Search,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SectionSeparator,
  SuiteAccentScope,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@subway-builder-modded/shared-ui";
import { AnalyticsLineChart, AnalyticsPieChart } from "@subway-builder-modded/analytics";
import type { PieSlice } from "@subway-builder-modded/analytics";
import { getSuiteAnalyticsNavItem, getSuiteById } from "@/config/site-navigation";
import { navigate } from "@/lib/router";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import {
  DetailsMetricGrid,
  type DetailMetric,
} from "@/features/registry/detail/components/details-tab";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import {
  filterRegistryAnalyticsHistory,
  loadRegistryAnalyticsData,
  sumRegistryAnalyticsHistory,
  type RegistryAnalyticsData,
  type RegistryAnalyticsPeriodId,
} from "@/features/registry/analytics/lib/load-registry-analytics";

export type RegistryAnalyticsTabId = "overview" | "content" | "authors" | "map-statistics";

type RegistryAnalyticsPageProps = {
  tabId?: RegistryAnalyticsTabId;
  periodId?: RegistryAnalyticsPeriodId;
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
  content: "/registry/analytics/content",
  authors: "/registry/analytics/authors",
  "map-statistics": "/registry/analytics/map-statistics",
};

const OVERVIEW_PERIOD_PATHS: Record<RegistryAnalyticsPeriodId, string> = {
  "all-time": "/registry/analytics/overview/all-time",
  "3d": "/registry/analytics/overview/3d",
  "7d": "/registry/analytics/overview/7d",
  "14d": "/registry/analytics/overview/14d",
};

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
}: {
  value: RegistryAnalyticsPeriodId;
  onChange: (period: RegistryAnalyticsPeriodId) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as RegistryAnalyticsPeriodId)}
    >
      <TabsList className="grid !h-auto grid-cols-2 gap-1 rounded-xl border border-border/60 bg-card/70 p-1 sm:grid-cols-4">
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
          <PendingTab label="Content" icon={FileStack} />
        ) : activeTab === "authors" ? (
          <PendingTab label="Authors" icon={Users} />
        ) : (
          <PendingTab label="Map Statistics" icon={Map} />
        )}
      </section>
    </SuiteAccentScope>
  );
}
