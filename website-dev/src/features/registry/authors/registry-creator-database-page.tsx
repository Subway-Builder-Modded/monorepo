import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDown10,
  ArrowDownAZ,
  ArrowDownToLine,
  ArrowUp10,
  ArrowUpAZ,
  Download,
  ExternalLink,
  FolderGit2,
  LayoutDashboard,
  Loader2,
  Shuffle,
  Trash2,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  StyledPagination,
  SuiteAccentScope,
} from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { Link, navigate, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { AuthorRoleBadge } from "@/features/registry/components/author-role-badge";
import { RegistryTabs } from "@/features/registry/components/registry-tabs";
import { RegistryToolbarDropdown } from "@/features/registry/components/registry-toolbar-dropdown";
import { RegistryToolbarSearch } from "@/features/registry/components/registry-toolbar-search";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import {
  loadCreatorDatabaseData,
  type RegistryCreatorDatabaseAuthor,
  type RegistryCreatorDatabaseData,
  type RegistryCreatorDatabaseProject,
} from "./lib/load-creator-database";

type CreatorDatabaseTab = "authors" | "projects";
type CreatorSortId = "name" | "assets" | "downloads" | "author" | "random";
type SortDirection = "asc" | "desc";

type CreatorSortOption = {
  id: CreatorSortId;
  label: string;
  icon: LucideIcon;
  supportsDirection: boolean;
  tabs: "all" | CreatorDatabaseTab[];
};

const SORT_OPTIONS: CreatorSortOption[] = [
  { id: "name", label: "Name", icon: User, supportsDirection: true, tabs: "all" },
  {
    id: "assets",
    label: "Assets Published",
    icon: LayoutDashboard,
    supportsDirection: true,
    tabs: "all",
  },
  {
    id: "downloads",
    label: "Downloads",
    icon: Download,
    supportsDirection: true,
    tabs: "all",
  },
  {
    id: "author",
    label: "Author",
    icon: User,
    supportsDirection: true,
    tabs: ["projects"],
  },
  { id: "random", label: "Random", icon: Shuffle, supportsDirection: false, tabs: "all" },
];

const DEFAULT_TAB: CreatorDatabaseTab = "authors";
const DEFAULT_QUERY = "";
const DEFAULT_SORT_ID: CreatorSortId = "name";
const DEFAULT_SORT_DIR: SortDirection = "desc";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const ALLOWED_PAGE_SIZES = new Set<number>(PAGE_SIZE_OPTIONS);
const NUMERIC_SORT_IDS = new Set<CreatorSortId>(["assets", "downloads"]);
const numberFormatter = new Intl.NumberFormat("en-US");
const collator = new Intl.Collator("en", { sensitivity: "base" });

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function isSortSupportedForTab(option: CreatorSortOption, tab: CreatorDatabaseTab) {
  return option.tabs === "all" || option.tabs.includes(tab);
}

function getSortOptionLabel(option: CreatorSortOption, tab: CreatorDatabaseTab) {
  if (option.id === "assets" && tab === "projects") {
    return "Assets";
  }
  return option.label;
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return function random() {
    value += 0x6d2b_79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number) {
  const copy = [...items];
  const random = mulberry32(seed);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }

  return copy;
}

function applyDirection(value: number, direction: SortDirection) {
  return direction === "desc" ? -value : value;
}

function filterByQuery<T extends { searchText: string }>(items: T[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;
  return items.filter((item) => item.searchText.includes(normalizedQuery));
}

function parsePage(raw: string | null): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PAGE;
}

function parsePageSize(raw: string | null): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && ALLOWED_PAGE_SIZES.has(value) ? value : DEFAULT_PAGE_SIZE;
}

function normalizeSortId(raw: string | null, tab: CreatorDatabaseTab): CreatorSortId {
  const sortId = SORT_OPTIONS.some((option) => option.id === raw)
    ? (raw as CreatorSortId)
    : DEFAULT_SORT_ID;
  const option = SORT_OPTIONS.find((candidate) => candidate.id === sortId);
  return option && isSortSupportedForTab(option, tab) ? sortId : DEFAULT_SORT_ID;
}

function normalizeSortDir(raw: string | null): SortDirection {
  return raw === "asc" || raw === "desc" ? raw : DEFAULT_SORT_DIR;
}

function getCreatorDatabasePath(tab: CreatorDatabaseTab) {
  return tab === "projects" ? "/registry/authors/projects" : "/registry/authors";
}

function serializeCreatorParams({
  query,
  sortId,
  sortDir,
  page,
  pageSize,
}: {
  query: string;
  sortId: CreatorSortId;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (trimmedQuery) params.set("q", trimmedQuery);
  if (sortId !== DEFAULT_SORT_ID) params.set("sort", sortId);
  if (sortDir !== DEFAULT_SORT_DIR) params.set("dir", sortDir);
  if (page !== DEFAULT_PAGE) params.set("page", String(page));
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(pageSize));

  const search = params.toString();
  return search ? `?${search}` : "";
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const clampedPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (clampedPage - 1) * pageSize;

  return {
    totalPages,
    clampedPage,
    visibleRows: rows.slice(startIndex, startIndex + pageSize),
  };
}

function sortAuthors(
  authors: RegistryCreatorDatabaseAuthor[],
  sortId: CreatorSortId,
  direction: SortDirection,
  randomSeed: number,
) {
  if (sortId === "random") return shuffleWithSeed(authors, randomSeed);

  return [...authors].sort((left, right) => {
    if (sortId === "downloads") {
      return applyDirection(left.downloads - right.downloads, direction);
    }
    if (sortId === "assets") {
      return applyDirection(left.assets - right.assets, direction);
    }
    return applyDirection(collator.compare(right.label, left.label), direction);
  });
}

function sortProjects(
  projects: RegistryCreatorDatabaseProject[],
  sortId: CreatorSortId,
  direction: SortDirection,
  randomSeed: number,
) {
  if (sortId === "random") return shuffleWithSeed(projects, randomSeed);

  return [...projects].sort((left, right) => {
    if (sortId === "downloads") {
      return applyDirection(left.downloads - right.downloads, direction);
    }
    if (sortId === "assets") {
      return applyDirection(left.assets - right.assets, direction);
    }
    if (sortId === "author") {
      return applyDirection(collator.compare(right.authorLabel, left.authorLabel), direction);
    }
    return applyDirection(collator.compare(right.name, left.name), direction);
  });
}

function getRegistryTypeSearchUrl(typeId: "maps" | "mods", query?: string) {
  const typeConfig = getRegistryTypeConfigOrDefault(typeId);
  const search = query ? `?${new URLSearchParams({ q: query }).toString()}` : "";
  return `/registry/${typeConfig.routeSegment}${search}`;
}

function ProjectTypeCountPill({
  typeId,
  count,
  href,
}: {
  typeId: "maps" | "mods";
  count: number;
  href?: string;
}) {
  if (count <= 0) return null;

  const typeConfig = getRegistryTypeConfigOrDefault(typeId);
  const Icon = typeConfig.icon ?? FolderGit2;

  const content = (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold"
      style={
        {
          color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})`,
          borderColor: `color-mix(in srgb, ${typeConfig.accentLight} 34%, transparent)`,
          background: `color-mix(in srgb, ${typeConfig.accentLight} 10%, transparent)`,
        } as CSSProperties
      }
    >
      <Icon className="size-3.5" aria-hidden={true} />
      <span>{typeConfig.pluralLabel}</span>
      <span
        className="rounded border px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums"
        style={{
          borderColor: `color-mix(in srgb, ${typeConfig.accentLight} 38%, transparent)`,
          background: `color-mix(in srgb, ${typeConfig.accentLight} 14%, transparent)`,
        }}
      >
        {formatNumber(count)}
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      to={href}
      className="relative z-20 inline-flex no-underline transition-opacity hover:opacity-90 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}

function CollaborationCountPill({ count }: { count: number }) {
  if (count <= 0) return null;

  const registrySuite = getSuiteById("registry");

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold"
      style={
        {
          color: `light-dark(${registrySuite.accent.light}, ${registrySuite.accent.dark})`,
          borderColor: `color-mix(in srgb, ${registrySuite.accent.light} 34%, transparent)`,
          background: `color-mix(in srgb, ${registrySuite.accent.light} 10%, transparent)`,
        } as CSSProperties
      }
    >
      <Users className="size-3.5" aria-hidden={true} />
      <span>Collaborations</span>
      <span
        className="rounded border px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums"
        style={{
          borderColor: `color-mix(in srgb, ${registrySuite.accent.light} 38%, transparent)`,
          background: `color-mix(in srgb, ${registrySuite.accent.light} 14%, transparent)`,
        }}
      >
        {formatNumber(count)}
      </span>
    </span>
  );
}

function MetadataDivider() {
  return <span style={{ color: "color-mix(in srgb, currentColor 35%, transparent)" }}>|</span>;
}

function DownloadMetric({ downloads }: { downloads: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <ArrowDownToLine className="size-3.5" aria-hidden={true} />
      <span className="tabular-nums">{formatNumber(downloads)}</span>
    </span>
  );
}

function AssetMetric({ assets }: { assets: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <LayoutDashboard className="size-3.5" aria-hidden={true} />
      <span className="tabular-nums">{formatNumber(assets)}</span>
    </span>
  );
}

function AuthorDatabaseCard({ author }: { author: RegistryCreatorDatabaseAuthor }) {
  return (
    <article className="relative flex min-w-0 items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/75 px-4 py-3 shadow-sm">
      <Link
        to={author.href}
        aria-label={`Open ${author.label}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="sr-only">Open {author.label}</span>
      </Link>
      <div className="relative z-20 min-w-0 space-y-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={author.href}
            className="relative z-20 min-w-0 truncate text-lg font-semibold text-foreground underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--suite-accent-light)] hover:decoration-[color-mix(in_srgb,var(--suite-accent-light)_62%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {author.label}
          </Link>
          <AuthorRoleBadge authorId={author.id} className="cursor-pointer" />
          <ProjectTypeCountPill
            typeId="maps"
            count={author.maps}
            href={getRegistryTypeSearchUrl("maps", author.id)}
          />
          <ProjectTypeCountPill
            typeId="mods"
            count={author.mods}
            href={getRegistryTypeSearchUrl("mods", author.id)}
          />
          <CollaborationCountPill count={author.collaborations} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AssetMetric assets={author.assets} />
          <MetadataDivider />
          <DownloadMetric downloads={author.downloads} />
        </div>
      </div>
    </article>
  );
}

function ProjectDatabaseCard({ project }: { project: RegistryCreatorDatabaseProject }) {
  return (
    <article className="relative flex min-w-0 items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/75 px-4 py-3 shadow-sm">
      <Link
        to={project.href}
        aria-label={`Open ${project.name}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="sr-only">Open {project.name}</span>
      </Link>
      <div className="relative z-20 min-w-0 space-y-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={project.href}
            className="relative z-20 min-w-0 truncate text-lg font-semibold text-foreground underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--suite-accent-light)] hover:decoration-[color-mix(in_srgb,var(--suite-accent-light)_62%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {project.name}
          </Link>
          <ProjectTypeCountPill
            typeId="maps"
            count={project.maps}
            href={getRegistryTypeSearchUrl("maps")}
          />
          <ProjectTypeCountPill
            typeId="mods"
            count={project.mods}
            href={getRegistryTypeSearchUrl("mods")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <User className="size-3.5 shrink-0" aria-hidden={true} />
            <Link
              to={project.authorHref}
              className="relative z-20 min-w-0 truncate underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--suite-accent-light)] hover:decoration-[color-mix(in_srgb,var(--suite-accent-light)_62%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {project.authorLabel}
            </Link>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden={true} />
          </span>
          <MetadataDivider />
          <AssetMetric assets={project.assets} />
          <MetadataDivider />
          <DownloadMetric downloads={project.downloads} />
        </div>
      </div>
    </article>
  );
}

function CreatorTabs({
  value,
  onChange,
}: {
  value: CreatorDatabaseTab;
  onChange: (value: CreatorDatabaseTab) => void;
}) {
  const tabs = [
    { id: "authors" as const, label: "Authors", icon: User },
    { id: "projects" as const, label: "Projects", icon: FolderGit2 },
  ];

  return (
    <RegistryTabs
      value={value}
      tabs={tabs}
      ariaLabel="Creator database tabs"
      onValueChange={onChange}
    />
  );
}

function CreatorSortControls({
  activeTab,
  sortId,
  sortDir,
  onSortChange,
  onDirToggle,
  onRandomReshuffle,
}: {
  activeTab: CreatorDatabaseTab;
  sortId: CreatorSortId;
  sortDir: SortDirection;
  onSortChange: (sortId: CreatorSortId) => void;
  onDirToggle: () => void;
  onRandomReshuffle: () => void;
}) {
  const supportedOptions = SORT_OPTIONS.filter((option) =>
    isSortSupportedForTab(option, activeTab),
  );
  const activeOption =
    supportedOptions.find((option) => option.id === sortId) ?? supportedOptions[0]!;
  const ActiveIcon = activeOption.icon;
  const isNumericSort = NUMERIC_SORT_IDS.has(activeOption.id);

  return (
    <div className="flex items-center gap-2">
      <RegistryToolbarDropdown
        value={activeOption.id}
        onValueChange={(value) => onSortChange(value as CreatorSortId)}
        options={supportedOptions.map((option) => ({
          id: option.id,
          label: getSortOptionLabel(option, activeTab),
          icon: option.icon,
        }))}
        triggerClassName="min-w-[9.75rem] sm:min-w-[11.5rem]"
        triggerContent={
          <>
            <ActiveIcon className="size-4 shrink-0" aria-hidden={true} />
            <span>{getSortOptionLabel(activeOption, activeTab)}</span>
          </>
        }
      />

      {activeOption.supportsDirection ? (
        <button
          type="button"
          onClick={onDirToggle}
          className="inline-flex h-9 items-center rounded-lg border border-border/30 bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,var(--background))] hover:text-[var(--suite-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_8%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]"
          aria-label="Toggle sort direction"
        >
          {isNumericSort ? (
            sortDir === "asc" ? (
              <ArrowUp10 className="size-4" aria-hidden={true} />
            ) : (
              <ArrowDown10 className="size-4" aria-hidden={true} />
            )
          ) : sortDir === "asc" ? (
            <ArrowUpAZ className="size-4" aria-hidden={true} />
          ) : (
            <ArrowDownAZ className="size-4" aria-hidden={true} />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onRandomReshuffle}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/30 bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,var(--background))] hover:text-[var(--suite-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_8%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]"
        >
          Reshuffle
        </button>
      )}
    </div>
  );
}

export function RegistryCreatorDatabasePage({
  tabId = DEFAULT_TAB,
}: {
  tabId?: CreatorDatabaseTab;
}) {
  const suite = getSuiteById("registry");
  const location = useLocation();
  const [data, setData] = useState<RegistryCreatorDatabaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const activeTab = tabId;

  const params = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const sortId = normalizeSortId(searchParams.get("sort"), activeTab);

    return {
      query: searchParams.get("q") ?? DEFAULT_QUERY,
      sortId,
      sortDir: sortId === "random" ? DEFAULT_SORT_DIR : normalizeSortDir(searchParams.get("dir")),
      page: parsePage(searchParams.get("page")),
      pageSize: parsePageSize(searchParams.get("pageSize")),
    };
  }, [activeTab, location.search]);

  const navigateWithParams = useCallback(
    (tab: CreatorDatabaseTab, updates: Partial<typeof params> = {}) => {
      const nextSortId = normalizeSortId(updates.sortId ?? params.sortId, tab);
      const nextParams = {
        query: updates.query ?? params.query,
        sortId: nextSortId,
        sortDir: nextSortId === "random" ? DEFAULT_SORT_DIR : (updates.sortDir ?? params.sortDir),
        page: updates.page ?? params.page,
        pageSize: updates.pageSize ?? params.pageSize,
      };

      navigate(`${getCreatorDatabasePath(tab)}${serializeCreatorParams(nextParams)}`, {
        preserveScroll: true,
      });
    },
    [params],
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    void loadCreatorDatabaseData()
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch(() => {
        if (!cancelled) setData({ authors: [], projects: [] });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const authorRows = useMemo(() => {
    const rows = (data?.authors ?? []).map((author) => ({
      ...author,
      searchText: `${author.label} ${author.id}`.toLowerCase(),
    }));
    return sortAuthors(
      filterByQuery(rows, params.query),
      params.sortId,
      params.sortDir,
      randomSeed,
    );
  }, [data?.authors, params.query, params.sortDir, params.sortId, randomSeed]);

  const projectRows = useMemo(() => {
    const rows = (data?.projects ?? []).map((project) => ({
      ...project,
      searchText:
        `${project.name} ${project.id} ${project.authorLabel} ${project.authorId}`.toLowerCase(),
    }));
    return sortProjects(
      filterByQuery(rows, params.query),
      params.sortId,
      params.sortDir,
      randomSeed,
    );
  }, [data?.projects, params.query, params.sortDir, params.sortId, randomSeed]);

  const activeRows: Array<RegistryCreatorDatabaseAuthor | RegistryCreatorDatabaseProject> =
    activeTab === "authors" ? authorRows : projectRows;
  const { clampedPage, totalPages, visibleRows } = paginateRows(
    activeRows,
    params.page,
    params.pageSize,
  );

  useEffect(() => {
    if (params.page === clampedPage) return;
    navigateWithParams(activeTab, { page: clampedPage });
  }, [activeTab, clampedPage, navigateWithParams, params.page]);

  const handleClearSearch = useCallback(() => {
    navigateWithParams(activeTab, { query: "", page: 1 });
  }, [activeTab, navigateWithParams]);

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <div
        className="relative isolate w-full px-5 pb-24 pt-[clamp(3.75rem,6.5vh,5.75rem)] sm:px-7 md:px-9 lg:px-12"
        style={
          {
            "--registry-type-accent": "var(--suite-accent-light)",
            "--registry-type-accent-strong": "var(--suite-accent-light)",
          } as CSSProperties
        }
      >
        <div className="space-y-6">
          <div
            className="flex min-h-24 items-center justify-center rounded-2xl px-5 py-6 text-center"
            style={{
              background: `light-dark(
                color-mix(in srgb, ${suite.accent.light} 10%, transparent),
                color-mix(in srgb, ${suite.accent.dark} 8%, transparent)
              )`,
              border: `1.5px solid light-dark(
                color-mix(in srgb, ${suite.accent.light} 16%, transparent),
                color-mix(in srgb, ${suite.accent.dark} 12%, transparent)
              )`,
            }}
          >
            <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">
              <Users
                className="size-8 shrink-0 text-[var(--suite-accent-light)] sm:size-9"
                aria-hidden={true}
              />
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Creator Database
              </h1>
            </div>
          </div>

          <CreatorTabs
            value={activeTab}
            onChange={(nextTab) => {
              navigateWithParams(nextTab, { page: 1 });
            }}
          />

          <section className="space-y-5">
            <div className="rounded-xl border border-border/30 bg-card px-3 py-3 shadow-sm">
              <div className="space-y-3">
                <RegistryToolbarSearch
                  query={params.query}
                  onChange={(query) => navigateWithParams(activeTab, { query, page: 1 })}
                  placeholder={`Search ${activeTab}...`}
                  clearLabel="Clear creator search"
                />

                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:justify-between lg:overflow-visible lg:pb-0">
                  <div className="flex min-w-max items-center gap-2">
                    <CreatorSortControls
                      activeTab={activeTab}
                      sortId={params.sortId}
                      sortDir={params.sortDir}
                      onSortChange={(nextSortId) =>
                        navigateWithParams(activeTab, { sortId: nextSortId, page: 1 })
                      }
                      onDirToggle={() =>
                        navigateWithParams(activeTab, {
                          sortDir: params.sortDir === "asc" ? "desc" : "asc",
                          page: 1,
                        })
                      }
                      onRandomReshuffle={() => setRandomSeed(Date.now())}
                    />
                  </div>

                  <div className="ml-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      disabled={!params.query}
                      aria-label="Clear search"
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/30 bg-background text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        params.query
                          ? "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_8%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]"
                          : "cursor-not-allowed opacity-45",
                      )}
                    >
                      <Trash2 className="size-4" aria-hidden={true} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/15">
                <Loader2
                  className="size-9 animate-spin text-muted-foreground motion-reduce:animate-none"
                  aria-hidden={true}
                />
              </div>
            ) : activeRows.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 text-center text-sm text-muted-foreground">
                No {activeTab} match your search.
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  {activeTab === "authors"
                    ? visibleRows.map((author) => (
                        <AuthorDatabaseCard
                          key={author.id}
                          author={author as RegistryCreatorDatabaseAuthor}
                        />
                      ))
                    : visibleRows.map((project) => (
                        <ProjectDatabaseCard
                          key={project.id}
                          project={project as RegistryCreatorDatabaseProject}
                        />
                      ))}
                </div>

                <StyledPagination
                  className="mt-10"
                  page={clampedPage}
                  totalPages={totalPages}
                  totalItems={activeRows.length}
                  pageSize={params.pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  itemLabel={"Cards"}
                  onPageChange={(nextPage) => {
                    navigateWithParams(activeTab, {
                      page: Math.min(Math.max(nextPage, 1), totalPages),
                    });
                  }}
                  onPageSizeChange={(nextPageSize) => {
                    navigateWithParams(activeTab, { pageSize: nextPageSize, page: 1 });
                  }}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </SuiteAccentScope>
  );
}
