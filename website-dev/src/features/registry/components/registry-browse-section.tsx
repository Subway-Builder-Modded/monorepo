import { useMemo, useState, useEffect, useCallback, useDeferredValue, useRef } from "react";
import { getInitialRegistrySidebarCollapsed } from "./registry-filter-sidebar";
import { RegistryItemCard } from "@/shared/registry-card/registry-item-card";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import { filterRegistryItems, collectTags } from "@/features/registry/lib/filter-registry-items";
import { sortRegistryItems } from "@/features/registry/lib/sort-registry-items";
import { RegistryFilterSidebar } from "./registry-filter-sidebar";
import { RegistryViewToggle } from "./registry-view-toggle";
import { RegistrySortBar } from "./registry-sort-bar";
import { Search, Trash2, X } from "lucide-react";
import {
  Pagination,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { REGISTRY_EMPTY_STATE_MESSAGE } from "@/features/registry/registry-content";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import type { RegistrySortId, RegistryViewMode } from "@/features/registry/lib/types";

import type { RegistryCardVariant } from "@/shared/registry-card/registry-item-types";
import { Database, Map, Package } from "lucide-react";

type RegistryBrowseSectionProps = {
  allItemsByType: Record<string, RegistrySearchItem[]>;
  isLoading: boolean;
  // URL-bound state (lifted)
  typeId: string;
  query: string;
  selectedTags: string[];
  sortId: RegistrySortId;
  sortDir: "asc" | "desc";
  viewMode: RegistryViewMode;
  onTypeChange: (id: string) => void;
  onQueryChange: (q: string) => void;
  onTagToggle: (tag: string) => void;
  onTagsClear: () => void;
  onSortChange: (id: RegistrySortId) => void;
  onDirToggle: () => void;
  onViewChange: (mode: RegistryViewMode) => void;
};

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PAGE_SIZE = 12;

export function RegistryBrowseSection({
  allItemsByType,
  isLoading,
  typeId,
  query,
  selectedTags,
  sortId,
  sortDir,
  viewMode,
  onTypeChange,
  onQueryChange,
  onTagToggle,
  onTagsClear,
  onSortChange,
  onDirToggle,
  onViewChange,
}: RegistryBrowseSectionProps) {
  const [isMac, setIsMac] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialRegistrySidebarCollapsed);
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const preloadedThumbnailSrcs = useRef<Set<string>>(new Set());
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes("mac"));
  }, []);

  // Reset page when filters change, and scroll to content only after user interaction.
  // This prevents URL/state hydration from auto-jumping past the hero on initial page load.
  const hasMountedRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  useEffect(() => {
    const markInteracted = () => {
      hasUserInteractedRef.current = true;
    };

    window.addEventListener("pointerdown", markInteracted, { passive: true });
    window.addEventListener("keydown", markInteracted);

    return () => {
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("keydown", markInteracted);
    };
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setPage(1);
    if (!hasUserInteractedRef.current) {
      return;
    }
    const el = document.getElementById("registry-browse-content-start");
    el?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [typeId, query, selectedTags, sortId, sortDir, pageSize]);

  const typeItems = allItemsByType[typeId] ?? [];

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [tid, items] of Object.entries(allItemsByType)) {
      result[tid] = items.length;
    }
    return result;
  }, [allItemsByType]);

  const availableTags = useMemo(() => collectTags(typeItems), [typeItems]);

  const filteredItems = useMemo(
    () => filterRegistryItems(typeItems, deferredQuery, selectedTags),
    [typeItems, deferredQuery, selectedTags],
  );

  const sortedItems = useMemo(
    () => sortRegistryItems(filteredItems, sortId, sortDir, randomSeed),
    [filteredItems, sortId, sortDir, randomSeed],
  );

  useEffect(() => {
    for (const item of sortedItems) {
      const src = item.thumbnailSrc;
      if (!src || preloadedThumbnailSrcs.current.has(src)) continue;

      const image = new Image();
      image.src = src;
      preloadedThumbnailSrcs.current.add(src);
    }
  }, [sortedItems]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedItems.length / pageSize)),
    [sortedItems.length, pageSize],
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const visibleItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedItems.slice(start, end);
  }, [sortedItems, page, pageSize]);

  const typeConfig = getRegistryTypeConfigOrDefault(typeId);

  // Map view mode to card variant
  const cardVariant: RegistryCardVariant =
    viewMode === "list" ? "list" : viewMode === "full" ? "full" : "grid";

  const handleReshuffle = useCallback(() => {
    setRandomSeed(Date.now());
  }, []);

  const handleClearAll = useCallback(() => {
    onTagsClear();
    onQueryChange("");
  }, [onTagsClear, onQueryChange]);

  const hasActiveFilters = query.length > 0 || selectedTags.length > 0;

  return (
    <section
      id="registry-browse"
      className="relative mx-auto w-full max-w-[96rem] px-5 pb-24 pt-12 sm:px-7 md:px-9 lg:px-12"
    >
      <div
        id="registry-browse-content-start"
        className="scroll-mt-20 grid gap-4 lg:gap-5 lg:[grid-template-columns:var(--registry-sidebar-width)_minmax(0,1fr)]"
        style={{ ["--registry-sidebar-width" as string]: sidebarCollapsed ? "2.75rem" : "17.5rem" }}
      >
        <RegistryFilterSidebar
          typeId={typeId}
          typeItems={typeItems}
          counts={counts}
          onTypeChange={onTypeChange}
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={onTagToggle}
          onTagsClear={onTagsClear}
          onCollapsedChange={setSidebarCollapsed}
        />

        <div className="min-w-0">
          <div className="mb-6 space-y-5">
            <div
              className="flex items-center justify-center gap-3.5 rounded-2xl px-6 py-5 text-3xl font-bold tracking-tight text-foreground shadow-sm"
              style={{
                background: `light-dark(
                color-mix(in srgb, ${typeConfig.accentLight} 18%, transparent),
                color-mix(in srgb, ${typeConfig.accentDark} 14%, transparent)
              )`,
                border: `1.5px solid light-dark(
                color-mix(in srgb, ${typeConfig.accentLight} 30%, transparent),
                color-mix(in srgb, ${typeConfig.accentDark} 22%, transparent)
              )`,
              }}
            >
              {typeId === "maps" ? (
                <Map
                  className="size-8 shrink-0"
                  aria-hidden
                  style={{
                    color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})`,
                  }}
                />
              ) : (
                <Package
                  className="size-8 shrink-0"
                  aria-hidden
                  style={{
                    color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})`,
                  }}
                />
              )}
              <span>{typeConfig.label} Database</span>
            </div>

            <div className="space-y-2">
              <div className="group relative flex">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden={true}
                />
                <input
                  type="search"
                  role="searchbox"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search…"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="h-10 w-full appearance-none rounded-xl border border-border/50 bg-muted/30 pl-9 pr-24 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                />
                {!query ? (
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 ml-auto flex -translate-y-1/2 shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
                    aria-hidden={true}
                  >
                    <kbd className="rounded border border-border/70 bg-background/90 px-1.5 py-0.5 font-mono font-medium leading-none">
                      {isMac ? "Cmd" : "Ctrl"}
                    </kbd>
                    <span className="text-muted-foreground/70">+</span>
                    <kbd className="rounded border border-border/70 bg-background/90 px-1.5 py-0.5 font-mono font-medium leading-none">
                      M
                    </kbd>
                  </span>
                ) : null}
                {query ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onQueryChange("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" aria-hidden={true} />
                  </button>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RegistryViewToggle viewMode={viewMode} onChange={onViewChange} />
                  <RegistrySortBar
                    activeTypeId={typeId}
                    sortId={sortId}
                    sortDir={sortDir}
                    onSortChange={onSortChange}
                    onDirToggle={onDirToggle}
                    onRandomReshuffle={handleReshuffle}
                  />
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        disabled={!hasActiveFilters}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,var(--background))] hover:text-[var(--suite-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-background disabled:hover:text-muted-foreground dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_12%,var(--background))] dark:hover:text-[var(--suite-accent-dark)]"
                      >
                        <Trash2 className="size-4" aria-hidden={true} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[140]">
                      Clear All Filters
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {isLoading ? (
            <RegistryLoadingState cardVariant={cardVariant} />
          ) : sortedItems.length === 0 ? (
            <RegistryEmptyState
              query={query}
              selectedTags={selectedTags}
              onClear={handleClearAll}
            />
          ) : (
            <>
              <RegistryGrid items={visibleItems} typeId={typeId} cardVariant={cardVariant} />

              <Pagination
                className="mt-10"
                page={page}
                totalPages={totalPages}
                totalItems={sortedItems.length}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={(nextPage) => {
                  const clamped = Math.min(Math.max(nextPage, 1), totalPages);
                  setPage(clamped);
                }}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                }}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
type RegistryGridProps = {
  items: RegistrySearchItem[];
  typeId: string;
  cardVariant: RegistryCardVariant;
};

function RegistryGrid({ items, typeId, cardVariant }: RegistryGridProps) {
  const typeConfig = getRegistryTypeConfigOrDefault(typeId);

  if (cardVariant === "list") {
    return (
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <RegistryItemCard
              data={{
                id: item.id,
                href: item.href,
                title: item.name,
                author: item.author,
                authorId: item.authorId,
                description: item.description,
                thumbnailSrc: item.thumbnailSrc,
                totalDownloads: item.totalDownloads,
                tags: item.tags,
                cityCode: item.cityCode,
                countryCode: item.countryCode,
                countryName: item.countryName,
                countryEmoji: item.countryEmoji,
                population: item.population,
              }}
              typeConfig={typeConfig}
              variant="list"
            />
          </li>
        ))}
      </ul>
    );
  }

  if (cardVariant === "full") {
    return (
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="h-full">
            <RegistryItemCard
              data={{
                id: item.id,
                href: item.href,
                title: item.name,
                author: item.author,
                authorId: item.authorId,
                description: item.description,
                thumbnailSrc: item.thumbnailSrc,
                totalDownloads: item.totalDownloads,
                tags: item.tags,
                cityCode: item.cityCode,
                countryCode: item.countryCode,
                countryName: item.countryName,
                countryEmoji: item.countryEmoji,
                population: item.population,
              }}
              typeConfig={typeConfig}
              variant="full"
              className="h-full"
            />
          </li>
        ))}
      </ul>
    );
  }

  // Grid layout
  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <li key={item.id} className="h-full">
          <RegistryItemCard
            data={{
              id: item.id,
              href: item.href,
              title: item.name,
              author: item.author,
              authorId: item.authorId,
              description: item.description,
              thumbnailSrc: item.thumbnailSrc,
              totalDownloads: item.totalDownloads,
              tags: item.tags,
              cityCode: item.cityCode,
              countryCode: item.countryCode,
              countryName: item.countryName,
              countryEmoji: item.countryEmoji,
              population: item.population,
            }}
            typeConfig={typeConfig}
            variant="grid"
            className="h-full"
          />
        </li>
      ))}
    </ul>
  );
}

function RegistryLoadingState({ cardVariant }: { cardVariant: RegistryCardVariant }) {
  const shells = Array.from({ length: 8 }, (_, i) => i);

  if (cardVariant === "list") {
    return (
      <div className="space-y-2">
        {shells.map((i) => (
          <div
            key={i}
            className="flex h-20 animate-pulse gap-4 rounded-xl border border-border/40 bg-card/60 p-3"
          >
            <div className="aspect-[4/3] w-24 rounded-lg bg-muted/40" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-1/3 rounded bg-muted/40" />
              <div className="h-3 w-1/2 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cardVariant === "full") {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {shells.map((i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-border/40 bg-card/60"
          >
            <div className="w-full bg-muted/40 aspect-[16/9]" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-24 rounded bg-muted/40" />
              <div className="h-6 w-4/5 rounded bg-muted/40" />
              <div className="h-4 w-1/2 rounded bg-muted/30" />
              <div className="space-y-1.5">
                <div className="h-4 w-full rounded bg-muted/30" />
                <div className="h-4 w-full rounded bg-muted/30" />
                <div className="h-4 w-11/12 rounded bg-muted/30" />
                <div className="h-4 w-10/12 rounded bg-muted/30" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
      {shells.map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-border/40 bg-card/60"
        >
          <div className="w-full bg-muted/40 aspect-[16/8]" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-20 rounded bg-muted/40" />
            <div className="h-5 w-3/4 rounded bg-muted/40" />
            <div className="h-4 w-1/2 rounded bg-muted/30" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted/30" />
              <div className="h-3 w-5/6 rounded bg-muted/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type RegistryEmptyStateProps = {
  query: string;
  selectedTags: string[];
  onClear: () => void;
};

function RegistryEmptyState({ query, selectedTags, onClear }: RegistryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center" role="status">
      <Database className="size-10 text-muted-foreground/30" aria-hidden={true} />
      <p className="text-sm font-medium text-muted-foreground">{REGISTRY_EMPTY_STATE_MESSAGE}</p>
      {(query.length > 0 || selectedTags.length > 0) && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
