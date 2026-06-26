import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowDownToLine,
  ArrowDown,
  ArrowUpDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Clock,
  ExternalLink,
  History,
  LayoutDashboard,
  Loader2,
  Map as MapIcon,
  Package,
  Plus,
  Search,
  TrendingUp,
  Download,
  Trophy,
  User,
  X,
} from "lucide-react";
import {
  NeutralFadedUnderline,
  RankBadge,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { AnalyticsLineChart } from "@subway-builder-modded/analytics";
import { getSuiteById } from "@/config/site-navigation";
import { Link, navigate } from "@/lib/router";
import { NotFoundPage } from "@/features/not-found";
import { AuthorRoleBadge } from "@/features/registry/components/author-role-badge";
import { RegistryGrid } from "@/features/registry/components/browse/registry-grid";
import { RegistryEmptyState } from "@/features/registry/components/browse/registry-empty-state";
import { RegistrySortBar } from "@/features/registry/components/registry-sort-bar";
import { RegistryViewToggle } from "@/features/registry/components/registry-view-toggle";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import {
  DetailsMetricGrid,
  type DetailMetric,
} from "@/features/registry/detail/components/details-tab";
import { filterRegistryItems } from "@/features/registry/lib/filter-registry-items";
import { getRegistryAuthorUrl } from "@/features/registry/lib/routing";
import { sortRegistryItems } from "@/features/registry/lib/sort-registry-items";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import {
  DEFAULT_SORT_DIR,
  DEFAULT_SORT_ID,
  DEFAULT_VIEW_MODE,
} from "@/features/registry/lib/types";
import type { RegistrySortId, RegistryViewMode } from "@/features/registry/lib/types";
import {
  loadAuthorPageData,
  type RegistryAuthorAssetSummary,
  type RegistryAuthorPageData,
} from "@/features/registry/authors/lib/load-author-page-data";

type RegistryAuthorPageProps = {
  authorId: string;
  tabId?: string;
};

type AuthorTabId = "overview" | "analytics";

type AuthorAssetSectionProps = {
  typeId: string;
  items: RegistrySearchItem[];
};

type SortDirection = "asc" | "desc";
type AuthorTrendSortKey = "label" | "downloads";
type AuthorRankingSortKey = "name" | "downloads";
type AuthorHistoryMode = "total" | "maps" | "mods";
type AuthorAssetRankingMode = "maps" | "mods";
type AuthorAssetBrowserMode = "maps" | "mods";

const AUTHOR_ANALYTICS_TABLE_COLUMN_WIDTHS = {
  primary: "56%",
  secondary: "28%",
  rank: "16%",
} as const;

type AuthorToggleOption<T extends string> = {
  id: T;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  accentLight: string;
  accentDark: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const AUTHOR_ASSET_INCREMENT = 12;
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(timestamp: number) {
  return timestamp > 0 ? dateFormatter.format(new Date(timestamp)) : "Unknown date";
}

function formatNullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? formatNumber(value) : "—";
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

function SortableTableHead({
  label,
  active,
  direction,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const SortIcon = direction === "asc" ? ArrowUp : ArrowDown;
  const Icon = active ? SortIcon : ArrowUpDown;

  return (
    <TableHead className="px-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex w-full items-center gap-1.5 text-xs font-semibold uppercase leading-4 tracking-[0.12em] transition-colors hover:text-[var(--registry-type-accent)] focus-visible:outline-none ${
          active ? "text-[var(--registry-type-accent)]" : ""
        } ${align === "right" ? "justify-end text-right" : "justify-start text-left"}`}
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="uppercase">{label}</span>
        <Icon className="size-3.5 shrink-0" aria-hidden={true} />
      </button>
    </TableHead>
  );
}

function StaticTableHead({ label, align = "left" }: { label: string; align?: "left" | "right" }) {
  return (
    <TableHead className="px-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
      <span
        className={`inline-flex w-full items-center text-xs font-semibold uppercase leading-4 tracking-[0.12em] ${
          align === "right" ? "justify-end text-right" : "justify-start text-left"
        }`}
      >
        {label}
      </span>
    </TableHead>
  );
}

function AuthorAnalyticsModeToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: AuthorToggleOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="isolate inline-flex items-center gap-1 rounded-xl border border-border/50 bg-background/70 p-1 shadow-sm"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.id)}
            style={
              {
                "--type-accent-light": option.accentLight,
                "--type-accent-dark": option.accentDark,
              } as CSSProperties
            }
            className={`group relative flex h-9 min-w-[7.25rem] items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-[background-color,color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "border-[color-mix(in_srgb,var(--type-accent-light)_44%,transparent)] bg-[color-mix(in_srgb,var(--type-accent-light)_18%,var(--background))] text-[var(--type-accent-light)] dark:border-[color-mix(in_srgb,var(--type-accent-dark)_44%,transparent)] dark:bg-[color-mix(in_srgb,var(--type-accent-dark)_18%,var(--background))] dark:text-[var(--type-accent-dark)]"
                : "border-[color-mix(in_srgb,var(--type-accent-light)_20%,transparent)] bg-transparent text-[var(--type-accent-light)] hover:border-[color-mix(in_srgb,var(--type-accent-light)_36%,transparent)] hover:bg-[color-mix(in_srgb,var(--type-accent-light)_10%,var(--background))] dark:text-[var(--type-accent-dark)] dark:hover:border-[color-mix(in_srgb,var(--type-accent-dark)_36%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--type-accent-dark)_10%,var(--background))]"
            }`}
          >
            <span className="inline-flex flex-1 items-center justify-center gap-1.5">
              <Icon className="size-4 shrink-0" aria-hidden={true} />
              <span>{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function getCardVariant(viewMode: RegistryViewMode) {
  return viewMode === "list" ? "list" : viewMode === "full" ? "full" : "grid";
}

function AssetMetricLink({
  item,
  tooltip,
}: {
  item: RegistryAuthorAssetSummary | null;
  tooltip: ReactNode;
}) {
  if (!item) {
    return <span className="text-muted-foreground">None</span>;
  }

  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={item.href}
              className="truncate text-base font-semibold leading-tight underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--registry-type-accent)] hover:decoration-[color-mix(in_srgb,var(--registry-type-accent)_62%,transparent)]"
            >
              {item.name}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-56">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
    </span>
  );
}

function AssetSummaryValue({ item }: { item: RegistryAuthorAssetSummary | null }) {
  return (
    <AssetMetricLink
      item={item}
      tooltip={
        <span className="text-foreground">
          {formatDate(item?.publishedAt ?? 0)}
        </span>
      }
    />
  );
}

function AssetUpdateValue({ item }: { item: RegistryAuthorAssetSummary | null }) {
  return (
    <AssetMetricLink
      item={item}
      tooltip={
        <span className="text-foreground">
          {formatDate(item?.latestVersionUpdatedAt || 0)} •{" "}
          <span>{item?.latestVersion ?? "unknown"}</span>
        </span>
      }
    />
  );
}

function AuthorTabs({
  value,
  onValueChange,
}: {
  value: AuthorTabId;
  onValueChange: (next: AuthorTabId) => void;
}) {
  const tabs = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as AuthorTabId)}>
      <TabsList
        variant="default"
        aria-label="Registry author tabs"
        className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border/70 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:gap-2 sm:p-2"
        style={{
          backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="h-10 min-w-0 flex-row items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-sm leading-none tracking-normal text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent-strong)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_12%,var(--card))] hover:!text-[var(--registry-type-accent-strong)] dark:hover:!text-[var(--registry-type-accent-strong)] sm:px-3 data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent-strong)_60%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_18%,var(--card))] data-[state=active]:font-semibold data-[state=active]:!text-[var(--registry-type-accent-strong)]"
            >
              <Icon className="size-4 shrink-0" aria-hidden={true} />
              <span className="whitespace-nowrap leading-none">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

function AuthorAssetSection({ typeId, items }: AuthorAssetSectionProps) {
  const typeConfig = getRegistryTypeConfigOrDefault(typeId);
  const [query, setQuery] = useState("");
  const [sortId, setSortId] = useState<RegistrySortId>(DEFAULT_SORT_ID);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(DEFAULT_SORT_DIR);
  const [viewMode, setViewMode] = useState<RegistryViewMode>(DEFAULT_VIEW_MODE);
  const [visibleCount, setVisibleCount] = useState(AUTHOR_ASSET_INCREMENT);
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const TypeIcon = typeConfig.icon ?? (typeId === "maps" ? MapIcon : Package);

  const filteredItems = useMemo(() => filterRegistryItems(items, query, []), [items, query]);
  const sortedItems = useMemo(
    () => sortRegistryItems(filteredItems, sortId, sortDir, randomSeed),
    [filteredItems, randomSeed, sortDir, sortId],
  );
  const visibleItems = sortedItems.slice(0, visibleCount);
  const hasMoreItems = visibleCount < sortedItems.length;

  useEffect(() => {
    setVisibleCount(AUTHOR_ASSET_INCREMENT);
  }, [query, sortDir, sortId, viewMode]);

  return (
    <section
      className="space-y-4"
      style={
        {
          "--registry-type-accent": typeConfig.accentLight,
          "--registry-type-accent-light": typeConfig.accentLight,
          "--registry-type-accent-dark": typeConfig.accentDark,
          "--suite-accent-light": typeConfig.accentLight,
          "--suite-accent-dark": typeConfig.accentDark,
        } as CSSProperties
      }
    >
      <div
        className="flex min-h-24 items-center justify-center rounded-2xl border px-5 py-6 text-center"
        style={{
          borderColor: `color-mix(in srgb, ${typeConfig.accentLight} 28%, transparent)`,
          background: `linear-gradient(135deg, color-mix(in srgb, ${typeConfig.accentLight} 18%, transparent), color-mix(in srgb, ${typeConfig.accentLight} 7%, transparent))`,
        }}
      >
        <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <TypeIcon
            className="size-8 shrink-0 sm:size-9"
            aria-hidden={true}
            style={{ color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})` }}
          />
          <h3 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Published {typeConfig.pluralLabel}
          </h3>
          <span
            className="rounded-lg border px-3 py-1 text-lg font-semibold tabular-nums sm:text-xl"
            style={{
              color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})`,
              borderColor: `color-mix(in srgb, ${typeConfig.accentLight} 34%, transparent)`,
              background: `color-mix(in srgb, ${typeConfig.accentLight} 10%, transparent)`,
            }}
          >
            {formatNumber(items.length)}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border/30 bg-card px-3 py-3 shadow-sm">
        <div className="space-y-3">
          <div className="group relative flex">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden={true}
            />
            <input
              type="search"
              role="searchbox"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${typeConfig.pluralLabel.toLowerCase()}...`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-11 w-full appearance-none rounded-lg border border-border/30 bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent-light)_34%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent-light)_5%,var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-type-accent-light)_44%,transparent)] dark:hover:border-[color-mix(in_srgb,var(--registry-type-accent-dark)_34%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--registry-type-accent-dark)_5%,var(--background))] dark:focus-visible:ring-[color-mix(in_srgb,var(--registry-type-accent-dark)_44%,transparent)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground opacity-0 transition-[color,opacity] group-hover:opacity-100 hover:text-[var(--registry-type-accent-light)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-type-accent-light)_44%,transparent)] dark:hover:text-[var(--registry-type-accent-dark)]"
                aria-label={`Clear ${typeConfig.pluralLabel} search`}
              >
                <X className="size-3.5" aria-hidden={true} />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:justify-between lg:overflow-visible lg:pb-0">
            <div className="flex min-w-max items-center gap-2">
              <RegistryViewToggle viewMode={viewMode} onChange={setViewMode} />
              <RegistrySortBar
                activeTypeId={typeId}
                sortId={sortId}
                sortDir={sortDir}
                excludedSortIds={["author"]}
                onSortChange={(nextSortId) => {
                  setSortId(nextSortId);
                }}
                onDirToggle={() => setSortDir((current) => (current === "asc" ? "desc" : "asc"))}
                onRandomReshuffle={() => setRandomSeed(Date.now())}
              />
            </div>
          </div>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <RegistryEmptyState
          typeId={typeId}
          query={query}
          selectedTags={[]}
          onClear={() => setQuery("")}
        />
      ) : (
        <>
          <RegistryGrid
            items={visibleItems}
            typeId={typeId}
            cardVariant={getCardVariant(viewMode)}
            hideAuthor
          />
          {hasMoreItems ? (
            <div className="flex justify-center pt-3">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(current + AUTHOR_ASSET_INCREMENT, sortedItems.length),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[light-dark(var(--registry-type-accent-light),var(--registry-type-accent-dark))] bg-[light-dark(var(--registry-type-accent-light),var(--registry-type-accent-dark))] px-4 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-type-accent-light)_44%,transparent)]"
              >
                <Plus className="size-4" aria-hidden={true} />
                Load More Assets
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function AuthorPublishedAssets({ data }: { data: RegistryAuthorPageData }) {
  const mapsItems = data.itemsByType.maps ?? [];
  const modsItems = data.itemsByType.mods ?? [];
  const hasMaps = mapsItems.length > 0;
  const hasMods = modsItems.length > 0;
  const [typeId, setTypeId] = useState<AuthorAssetBrowserMode>(hasMaps ? "maps" : "mods");
  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");
  const typeOptions = [
    {
      id: "maps" as const,
      label: "Maps",
      icon: mapsConfig.icon ?? MapIcon,
      accentLight: mapsConfig.accentLight,
      accentDark: mapsConfig.accentDark,
      enabled: hasMaps,
    },
    {
      id: "mods" as const,
      label: "Mods",
      icon: modsConfig.icon ?? Package,
      accentLight: modsConfig.accentLight,
      accentDark: modsConfig.accentDark,
      enabled: hasMods,
    },
  ].filter((option) => option.enabled);
  const activeTypeId = typeOptions.length === 1 ? typeOptions[0].id : typeId;
  const activeItems = data.itemsByType[activeTypeId] ?? [];

  useEffect(() => {
    if (!typeOptions.some((option) => option.id === typeId) && typeOptions[0]) {
      setTypeId(typeOptions[0].id);
    }
  }, [typeId, typeOptions]);

  if (typeOptions.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionSeparator label="Published Assets" icon={Package} className="mb-4" />
      <section
        className="space-y-5 rounded-xl border border-border/70 p-4 sm:p-5"
        style={{
          backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
        }}
      >
        {typeOptions.length > 1 ? (
          <div className="flex justify-center">
            <AuthorAnalyticsModeToggle
              value={typeId}
              options={typeOptions}
              onChange={setTypeId}
              ariaLabel="Published asset type"
            />
          </div>
        ) : null}
        <AuthorAssetSection typeId={activeTypeId} items={activeItems} />
      </section>
    </div>
  );
}

function AuthorRankAccessory({ rank }: { rank: number | null }) {
  return (
    <RankBadge rank={rank} className="h-6 w-auto min-w-6 rounded-md px-1.5 text-[11px] shadow-sm" />
  );
}

function AuthorRecentTrendsTable({ data }: { data: RegistryAuthorPageData }) {
  const [sortKey, setSortKey] = useState<AuthorTrendSortKey>("downloads");
  const [directions, setDirections] = useState<Record<AuthorTrendSortKey, SortDirection>>({
    label: "asc",
    downloads: "desc",
  });
  const direction = directions[sortKey];
  const rows = useMemo(() => {
    return [...data.analytics.trends].sort((left, right) => {
      if (sortKey === "label") {
        return direction === "asc"
          ? left.label.localeCompare(right.label)
          : right.label.localeCompare(left.label);
      }
      return compareNullableNumbers(left[sortKey], right[sortKey], direction);
    });
  }, [data.analytics.trends, direction, sortKey]);

  const handleSort = (nextKey: AuthorTrendSortKey) => {
    setDirections((current) => ({
      ...current,
      [nextKey]: getNextDirection(sortKey, nextKey, current),
    }));
    setSortKey(nextKey);
  };

  return (
    <div>
      <SectionSeparator label="Recent Trends" icon={TrendingUp} className="mb-4 mt-7" />
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
        <Table>
          <colgroup>
            <col style={{ width: AUTHOR_ANALYTICS_TABLE_COLUMN_WIDTHS.primary }} />
            <col style={{ width: AUTHOR_ANALYTICS_TABLE_COLUMN_WIDTHS.secondary }} />
            <col style={{ width: AUTHOR_ANALYTICS_TABLE_COLUMN_WIDTHS.rank }} />
          </colgroup>
          <TableHeader>
            <TableRow className="border-border/70 bg-muted/35 hover:bg-muted/35">
              <SortableTableHead
                label="Period"
                active={sortKey === "label"}
                direction={direction}
                onClick={() => handleSort("label")}
              />
              <SortableTableHead
                label="Downloads"
                active={sortKey === "downloads"}
                direction={direction}
                onClick={() => handleSort("downloads")}
              />
              <StaticTableHead label="Rank" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((trend) => (
              <TableRow key={trend.period} className="border-border/60 hover:bg-transparent">
                <TableCell className="px-4 font-medium text-foreground">{trend.label}</TableCell>
                <TableCell className="px-4 font-semibold tabular-nums text-[var(--registry-type-accent)]">
                  {formatNullableNumber(trend.downloads)}
                </TableCell>
                <TableCell className="px-4">
                  <RankBadge rank={trend.rank} className="size-7 text-xs" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AuthorDownloadHistory({ data }: { data: RegistryAuthorPageData }) {
  const hasMaps = (data.itemsByType.maps ?? []).length > 0;
  const hasMods = (data.itemsByType.mods ?? []).length > 0;
  const hasMultipleAssetTypes = hasMaps && hasMods;
  const [mode, setMode] = useState<AuthorHistoryMode>("total");
  const activeMode: AuthorHistoryMode = hasMultipleAssetTypes
    ? mode
    : hasMaps
      ? "maps"
      : hasMods
        ? "mods"
        : "total";
  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");
  const modeOptions = [
    {
      id: "total" as const,
      label: "Total",
      icon: BarChart3,
      accentLight: "var(--suite-accent-light)",
      accentDark: "var(--suite-accent-dark)",
      color: "var(--suite-accent-light)",
      enabled: true,
    },
    {
      id: "maps" as const,
      label: "Maps",
      icon: mapsConfig.icon ?? MapIcon,
      accentLight: mapsConfig.accentLight,
      accentDark: mapsConfig.accentDark,
      color: mapsConfig.accentLight,
      enabled: hasMaps,
    },
    {
      id: "mods" as const,
      label: "Mods",
      icon: modsConfig.icon ?? Package,
      accentLight: modsConfig.accentLight,
      accentDark: modsConfig.accentDark,
      color: modsConfig.accentLight,
      enabled: hasMods,
    },
  ].filter((option) => option.enabled);
  const activeOption = modeOptions.find((option) => option.id === activeMode) ?? modeOptions[0];
  const chartData = data.analytics.history.map((point) => ({
    date: point.date,
    Downloads: point[activeMode],
  }));

  useEffect(() => {
    if (!modeOptions.some((option) => option.id === mode)) {
      setMode("total");
    }
  }, [mode, modeOptions]);

  if (chartData.length === 0) return null;

  return (
    <div>
      <SectionSeparator label="Download History" icon={History} className="mb-4 mt-7" />
      <article
        className="space-y-4 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5"
        style={{ "--registry-type-accent": activeOption.color } as CSSProperties}
      >
        {hasMultipleAssetTypes ? (
          <div className="flex justify-center">
            <AuthorAnalyticsModeToggle
              value={mode}
              options={modeOptions}
              onChange={setMode}
              ariaLabel="Download history mode"
            />
          </div>
        ) : null}
        <AnalyticsLineChart
          data={chartData}
          lines={[{ key: "Downloads", name: activeOption.label, color: activeOption.color }]}
          xAxisKey="date"
          height={220}
          startAtZero={true}
        />
      </article>
    </div>
  );
}

function AuthorAssetRankingsTable({ data }: { data: RegistryAuthorPageData }) {
  const hasMaps = (data.itemsByType.maps ?? []).length > 0;
  const hasMods = (data.itemsByType.mods ?? []).length > 0;
  const hasMultipleAssetTypes = hasMaps && hasMods;
  const [typeId, setTypeId] = useState<AuthorAssetRankingMode>(hasMaps ? "maps" : "mods");
  const [sortKey, setSortKey] = useState<AuthorRankingSortKey>("downloads");
  const [directions, setDirections] = useState<Record<AuthorRankingSortKey, SortDirection>>({
    name: "asc",
    downloads: "desc",
  });
  const direction = directions[sortKey];
  const mapsConfig = getRegistryTypeConfigOrDefault("maps");
  const modsConfig = getRegistryTypeConfigOrDefault("mods");
  const typeOptions = [
    {
      id: "maps" as const,
      label: "Maps",
      icon: mapsConfig.icon ?? MapIcon,
      accentLight: mapsConfig.accentLight,
      accentDark: mapsConfig.accentDark,
      enabled: hasMaps,
    },
    {
      id: "mods" as const,
      label: "Mods",
      icon: modsConfig.icon ?? Package,
      accentLight: modsConfig.accentLight,
      accentDark: modsConfig.accentDark,
      enabled: hasMods,
    },
  ].filter((option) => option.enabled);
  const activeTypeId = hasMultipleAssetTypes ? typeId : (typeOptions[0]?.id ?? typeId);
  const activeTypeConfig = getRegistryTypeConfigOrDefault(activeTypeId);
  const activeRowsForType = data.analytics.rankingsByType[activeTypeId] ?? [];
  const sortedRows = useMemo(() => {
    return [...activeRowsForType].sort((left, right) => {
      if (sortKey === "name") {
        return direction === "asc"
          ? left.name.localeCompare(right.name)
          : right.name.localeCompare(left.name);
      }
      return compareNullableNumbers(left[sortKey], right[sortKey], direction);
    });
  }, [activeRowsForType, direction, sortKey]);

  const handleSort = (nextKey: AuthorRankingSortKey) => {
    setDirections((current) => ({
      ...current,
      [nextKey]: getNextDirection(sortKey, nextKey, current),
    }));
    setSortKey(nextKey);
  };

  useEffect(() => {
    if (!typeOptions.some((option) => option.id === typeId) && typeOptions[0]) {
      setTypeId(typeOptions[0].id);
    }
  }, [typeId, typeOptions]);

  if (typeOptions.length === 0) return null;

  return (
    <div
      style={
        {
          "--registry-type-accent": activeTypeConfig.accentLight,
          "--registry-type-accent-light": activeTypeConfig.accentLight,
          "--registry-type-accent-dark": activeTypeConfig.accentDark,
        } as CSSProperties
      }
    >
      <SectionSeparator label="Asset Rankings" icon={Trophy} className="mb-4 mt-7" />
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
        {hasMultipleAssetTypes ? (
          <div className="flex justify-center border-b border-border/70 bg-muted/20 p-3">
            <AuthorAnalyticsModeToggle
              value={typeId}
              options={typeOptions}
              onChange={setTypeId}
              ariaLabel="Asset ranking type"
            />
          </div>
        ) : null}
        <Table>
          <colgroup>
            <col style={{ width: AUTHOR_ANALYTICS_TABLE_COLUMN_WIDTHS.primary }} />
            <col style={{ width: AUTHOR_ANALYTICS_TABLE_COLUMN_WIDTHS.secondary }} />
            <col style={{ width: AUTHOR_ANALYTICS_TABLE_COLUMN_WIDTHS.rank }} />
          </colgroup>
          <TableHeader>
            <TableRow className="border-border/70 bg-muted/35 hover:bg-muted/35">
              <SortableTableHead
                label={`${activeTypeConfig.label} Name`}
                active={sortKey === "name"}
                direction={direction}
                onClick={() => handleSort("name")}
              />
              <SortableTableHead
                label="Downloads"
                active={sortKey === "downloads"}
                direction={direction}
                onClick={() => handleSort("downloads")}
              />
              <StaticTableHead label="Rank" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.id} className="border-border/60 hover:bg-transparent">
                <TableCell className="px-4 font-medium">
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <Link
                      to={row.href}
                      className="truncate text-foreground underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--registry-type-accent)] hover:decoration-[color-mix(in_srgb,var(--registry-type-accent)_62%,transparent)]"
                    >
                      {row.name}
                    </Link>
                    <ExternalLink
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden={true}
                    />
                  </span>
                </TableCell>
                <TableCell className="px-4 font-semibold tabular-nums text-[var(--registry-type-accent)]">
                  {formatNumber(row.downloads)}
                </TableCell>
                <TableCell className="px-4">
                  <RankBadge rank={row.rank} className="size-7 text-xs" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AuthorAnalytics({ data }: { data: RegistryAuthorPageData }) {
  const hasMaps = (data.itemsByType.maps ?? []).length > 0;
  const hasMods = (data.itemsByType.mods ?? []).length > 0;
  const hasMultipleAssetTypes = hasMaps && hasMods;
  const cards: DetailMetric[] = hasMultipleAssetTypes
    ? [
        {
          title: "Downloads (Total)",
          value: formatNumber(data.analytics.downloads.total),
          icon: Download,
          titleAccessory: <AuthorRankAccessory rank={data.analytics.ranks.total} />,
        },
        {
          title: "Downloads (Maps)",
          value: formatNumber(data.analytics.downloads.maps),
          icon: MapIcon,
          titleAccessory: <AuthorRankAccessory rank={data.analytics.ranks.maps} />,
        },
        {
          title: "Downloads (Mods)",
          value: formatNumber(data.analytics.downloads.mods),
          icon: Package,
          titleAccessory: <AuthorRankAccessory rank={data.analytics.ranks.mods} />,
        },
      ]
    : [
        {
          title: "Downloads",
          value: formatNumber(data.analytics.downloads.total),
          icon: Download,
          titleAccessory: <AuthorRankAccessory rank={data.analytics.ranks.total} />,
        },
      ];

  return (
    <section
      className="space-y-3 [--registry-type-accent:var(--suite-accent-light)]"
      style={{ "--registry-type-accent": "var(--suite-accent-light)" } as CSSProperties}
    >
      <div>
        <SectionSeparator label="Analytics" icon={BarChart3} className="mb-4" />
        <DetailsMetricGrid
          className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          items={cards}
          accentLight="var(--suite-accent-light)"
          accentDark="var(--suite-accent-dark)"
        />
      </div>
      <AuthorRecentTrendsTable data={data} />
      <AuthorDownloadHistory data={data} />
      {hasMaps || hasMods ? <AuthorAssetRankingsTable data={data} /> : null}
    </section>
  );
}

function AuthorOverview({ data }: { data: RegistryAuthorPageData }) {
  const allItems = Object.values(data.itemsByType).flat();
  const totalDownloads = allItems.reduce((sum, item) => sum + item.totalDownloads, 0);

  const metrics: DetailMetric[] = [
    {
      title: "Assets Published",
      value: formatNumber(allItems.length),
      icon: LayoutDashboard,
    },
    {
      title: "Downloads",
      value: formatNumber(totalDownloads),
      icon: ArrowDownToLine,
    },
    {
      title: "Newest Asset",
      value: <AssetSummaryValue item={data.overview.newestAsset} />,
      icon: CalendarDays,
    },
    {
      title: "Most Recent Update",
      value: <AssetUpdateValue item={data.overview.mostRecentUpdate} />,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <SectionSeparator label="Overview" icon={LayoutDashboard} className="mb-4" />
        <section
          className="rounded-xl border border-border/70 p-4 sm:p-5"
          style={{
            backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
          }}
        >
          <DetailsMetricGrid
            className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            items={metrics}
            accentLight="var(--suite-accent-light)"
            accentDark="var(--suite-accent-dark)"
          />
        </section>
      </div>

      <AuthorPublishedAssets data={data} />
    </div>
  );
}

export function RegistryAuthorPage({ authorId, tabId }: RegistryAuthorPageProps) {
  const suite = getSuiteById("registry");
  const [data, setData] = useState<RegistryAuthorPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeTab: AuthorTabId = tabId === "analytics" ? "analytics" : "overview";

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setData(null);

    void loadAuthorPageData(authorId)
      .then((loaded) => {
        if (!cancelled) {
          setData(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authorId]);

  if (isLoading) {
    return (
      <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
        <div className="relative isolate flex min-h-[55vh] items-center justify-center px-5 py-6 sm:px-7 md:px-9 lg:px-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2
              className="size-11 animate-spin will-change-transform motion-reduce:animate-none"
              aria-hidden={true}
            />
            <span className="text-2xl font-semibold tracking-tight">Loading...</span>
          </div>
        </div>
      </SuiteAccentScope>
    );
  }

  if (!data) {
    return <NotFoundPage />;
  }

  const attributionLink = data.author.attributionLink;

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <div
        className="relative isolate w-full px-5 py-6 sm:px-7 md:px-9 lg:px-12"
        style={
          {
            "--registry-type-accent": "var(--suite-accent-light)",
            "--registry-type-accent-strong": "var(--suite-accent-light)",
          } as CSSProperties
        }
      >
        <div className="relative z-10 space-y-6">
          <header className="space-y-6 pt-3 sm:pt-4">
            <div className="bg-transparent py-2 sm:py-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="relative min-w-0 flex-1">
                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-semibold"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--suite-accent-light) 34%, transparent)",
                          background:
                            "color-mix(in srgb, var(--suite-accent-light) 16%, transparent)",
                          color: "var(--suite-accent-light)",
                        }}
                      >
                        <User className="size-4" aria-hidden={true} />
                        Author
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="inline-block max-w-full align-top">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h1 className="m-0 text-balance text-4xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-5xl">
                            {data.author.authorAlias}
                          </h1>
                          <AuthorRoleBadge
                            authorId={data.author.authorId}
                            className="mt-1.5 text-4xl sm:text-5xl"
                          />
                        </div>

                        <NeutralFadedUnderline className="mt-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {attributionLink ? (
                  <a
                    href={attributionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${data.author.authorAlias} attribution link`}
                    className="inline-flex h-10 w-10 items-center justify-center justify-self-start rounded-lg text-muted-foreground transition-colors hover:text-[var(--suite-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:justify-self-end"
                  >
                    <ExternalLink className="size-6" aria-hidden={true} />
                  </a>
                ) : null}
              </div>
            </div>
          </header>

          <div className="space-y-5">
            <AuthorTabs
              value={activeTab}
              onValueChange={(nextTab) => {
                navigate(getRegistryAuthorUrl(authorId, nextTab), { preserveScroll: true });
              }}
            />

            <main className="min-w-0">
              <div hidden={activeTab !== "overview"}>
                <AuthorOverview data={data} />
              </div>
              <div hidden={activeTab !== "analytics"}>
                <AuthorAnalytics data={data} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </SuiteAccentScope>
  );
}
