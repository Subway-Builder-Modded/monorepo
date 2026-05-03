import { useMemo, useState, useEffect, useCallback, useDeferredValue, useRef } from "react";
import { RegistryItemCard } from "@/shared/registry-card/registry-item-card";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import { filterRegistryItems, collectTags } from "@/features/registry/lib/filter-registry-items";
import { sortRegistryItems } from "@/features/registry/lib/sort-registry-items";
import { FloatingRegistrySearch } from "./floating-registry-search";
import { Pagination } from "@subway-builder-modded/shared-ui";
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
  showFloatingSearch: boolean;
  isSearchActive?: boolean;
  onActivateSearch: () => void;
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
  showFloatingSearch,
  isSearchActive = false,
  onActivateSearch,
}: RegistryBrowseSectionProps) {
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const preloadedThumbnailSrcs = useRef<Set<string>>(new Set());
  const sectionRef = useRef<HTMLElement>(null);
  const deferredQuery = useDeferredValue(query);

  // Anchor the floating toolbar to the section once the section's bottom enters the viewport.
  // At the exact threshold (section.bottom === window.innerHeight), both `fixed bottom-4` and
  // `absolute bottom-4` produce the same visual position, so the switch is seamless.
  const [isToolbarAnchored, setIsToolbarAnchored] = useState(false);
  useEffect(() => {
    const check = () => {
      const section = sectionRef.current;
      if (!section) return;
      setIsToolbarAnchored(section.getBoundingClientRect().bottom <= window.innerHeight);
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
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
  const cardVariant: RegistryCardVariant = viewMode === "list" ? "list" : "grid";

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
      ref={sectionRef}
      id="registry-browse"
      className="relative mx-auto w-full max-w-[96rem] px-5 pb-24 pt-12 sm:px-7 md:px-9 lg:px-12"
    >
      <FloatingRegistrySearch
        isVisible={showFloatingSearch}
        isSuppressed={isSearchActive}
        isAnchored={isToolbarAnchored}
        query={query}
        onActivate={onActivateSearch}
        typeId={typeId}
        counts={counts}
        onTypeChange={onTypeChange}
        viewMode={viewMode}
        onViewChange={onViewChange}
        sortId={sortId}
        sortDir={sortDir}
        onSortChange={onSortChange}
        onDirToggle={onDirToggle}
        onRandomReshuffle={handleReshuffle}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onTagToggle={onTagToggle}
        onTagsClear={onTagsClear}
        onClearQuery={() => onQueryChange("")}
      />

      <div className="mt-0">
        {/* Section header */}
        <div className="mb-6 space-y-5">
          {/* Type database heading */}
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
                style={{ color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})` }}
              />
            ) : (
              <Package
                className="size-8 shrink-0"
                aria-hidden
                style={{ color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})` }}
              />
            )}
            <span>{typeConfig.label} Database</span>
          </div>

          {/* Filters summary row */}
          {hasActiveFilters && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Grid / list */}
        {isLoading ? (
          <RegistryLoadingState cardVariant={cardVariant} />
        ) : sortedItems.length === 0 ? (
          <RegistryEmptyState query={query} selectedTags={selectedTags} onClear={handleClearAll} />
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

  // Grid layout
  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <li key={item.id}>
          <RegistryItemCard
            data={{
              id: item.id,
              href: item.href,
              title: item.name,
              author: item.author,
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
