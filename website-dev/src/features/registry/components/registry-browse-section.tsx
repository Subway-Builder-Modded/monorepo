import { useMemo, useState, useEffect, useRef } from "react";
import { getInitialRegistrySidebarCollapsed } from "./registry-filter-sidebar";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import { RegistryFilterSidebar } from "./registry-filter-sidebar";
import { RegistryViewToggle } from "./registry-view-toggle";
import { RegistrySortBar } from "./registry-sort-bar";
import { Search, Trash2, X } from "lucide-react";
import {
  StyledPagination,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { getRegistryTypeIcon } from "@/features/registry/registry-type-ui";
import type { RegistrySearchItem } from "@/features/registry/lib/registry-search-types";
import type { RegistrySortId, RegistryViewMode } from "@/features/registry/lib/types";
import { RegistryGrid } from "./browse/registry-grid";
import { RegistryLoadingState } from "./browse/registry-loading-state";
import { RegistryEmptyState } from "./browse/registry-empty-state";
import { useRegistryBrowseData } from "./browse/use-registry-browse-data";

import type { RegistryCardVariant } from "@/shared/registry-card/registry-item-types";

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
  page: number;
  pageSize: number;
  onTypeChange: (id: string) => void;
  onQueryChange: (q: string) => void;
  onTagToggle: (tag: string) => void;
  onTagsClear: () => void;
  onSortChange: (id: RegistrySortId) => void;
  onDirToggle: () => void;
  onViewChange: (mode: RegistryViewMode) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export function RegistryBrowseSection({
  allItemsByType,
  isLoading,
  typeId,
  query,
  selectedTags,
  sortId,
  sortDir,
  viewMode,
  page,
  pageSize,
  onTypeChange,
  onQueryChange,
  onTagToggle,
  onTagsClear,
  onSortChange,
  onDirToggle,
  onViewChange,
  onPageChange,
  onPageSizeChange,
}: RegistryBrowseSectionProps) {
  const [isMac, setIsMac] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialRegistrySidebarCollapsed);
  const selectedTagsKey = useMemo(() => selectedTags.join("\u001f"), [selectedTags]);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

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
    onPageChangeRef.current(1);
    if (!hasUserInteractedRef.current) {
      return;
    }
    const el = document.getElementById("registry-browse-content-start");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [typeId, query, selectedTagsKey, sortId, sortDir]);

  const { typeItems, counts, availableTags, sortedItems, totalPages, visibleItems, handleReshuffle } =
    useRegistryBrowseData({
      allItemsByType,
      typeId,
      query,
      selectedTags,
      sortId,
      sortDir,
      page,
      pageSize,
      isLoading,
      onPageChange,
    });

  const typeConfig = getRegistryTypeConfigOrDefault(typeId);

  // Map view mode to card variant
  const cardVariant: RegistryCardVariant =
    viewMode === "list" ? "list" : viewMode === "full" ? "full" : "grid";

  const handleClearAll = () => {
    onTagsClear();
    onQueryChange("");
  };

  const hasActiveFilters = query.length > 0 || selectedTags.length > 0;
  const TypeIcon = getRegistryTypeIcon(typeId);

  return (
    <section
      id="registry-browse"
      className="relative w-full px-5 pb-24 pt-10 sm:px-7 md:px-9 lg:px-12"
    >
      <div
        id="registry-browse-content-start"
        className="scroll-mt-20 grid gap-4 transition-[grid-template-columns] duration-200 ease-in-out motion-reduce:transition-none lg:gap-5 lg:[grid-template-columns:var(--registry-sidebar-width)_minmax(0,1fr)]"
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
          <div className="mb-6 space-y-4">
            <div
              className="flex items-center justify-center gap-3 rounded-xl px-5 py-4 text-[1.7rem] font-semibold tracking-tight text-foreground"
              style={{
                background: `light-dark(
                color-mix(in srgb, ${typeConfig.accentLight} 10%, transparent),
                color-mix(in srgb, ${typeConfig.accentDark} 8%, transparent)
              )`,
                border: `1.5px solid light-dark(
                color-mix(in srgb, ${typeConfig.accentLight} 16%, transparent),
                color-mix(in srgb, ${typeConfig.accentDark} 12%, transparent)
              )`,
              }}
            >
              <TypeIcon
                className="size-8 shrink-0"
                aria-hidden
                style={{
                  color: `light-dark(${typeConfig.accentLight}, ${typeConfig.accentDark})`,
                }}
              />
              <span>{typeConfig.label} Database</span>
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
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Search…"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="h-11 w-full appearance-none rounded-lg border border-border/30 bg-background pl-9 pr-24 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-border/35 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                  />
                  {!query ? (
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 ml-auto flex -translate-y-1/2 shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
                      aria-hidden={true}
                    >
                      <kbd className="rounded-md border border-border/45 bg-muted/20 px-1.5 py-0.5 font-mono font-medium leading-none">
                        {isMac ? "Cmd" : "Ctrl"}
                      </kbd>
                      <span className="text-muted-foreground/70">+</span>
                      <kbd className="rounded-md border border-border/45 bg-muted/20 px-1.5 py-0.5 font-mono font-medium leading-none">
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

                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:justify-between lg:overflow-visible lg:pb-0">
                  <div className="flex min-w-max items-center gap-2">
                    <RegistryViewToggle
                      className="shrink-0"
                      viewMode={viewMode}
                      onChange={onViewChange}
                    />
                    <RegistrySortBar
                      className="shrink-0"
                      activeTypeId={typeId}
                      sortId={sortId}
                      sortDir={sortDir}
                      onSortChange={onSortChange}
                      onDirToggle={onDirToggle}
                      onRandomReshuffle={handleReshuffle}
                    />
                  </div>

                  <div className="ml-auto shrink-0">
                    {hasActiveFilters ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={handleClearAll}
                              aria-label="Clear all filters"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/30 bg-background text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_8%,var(--background))] hover:text-[var(--suite-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_8%,var(--background))] dark:hover:text-[var(--suite-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Trash2 className="size-4" aria-hidden={true} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-[140]">
                            Clear All Filters
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-label="Clear all filters"
                        className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-border/30 bg-background text-muted-foreground opacity-45"
                      >
                        <Trash2 className="size-4" aria-hidden={true} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <RegistryLoadingState cardVariant={cardVariant} />
          ) : sortedItems.length === 0 ? (
            <RegistryEmptyState
              typeId={typeId}
              query={query}
              selectedTags={selectedTags}
              onClear={handleClearAll}
            />
          ) : (
            <>
              <RegistryGrid items={visibleItems} typeId={typeId} cardVariant={cardVariant} />

              <StyledPagination
                className="mt-10"
                page={page}
                totalPages={totalPages}
                totalItems={sortedItems.length}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                itemLabel="Cards"
                onPageChange={(nextPage) => {
                  const clamped = Math.min(Math.max(nextPage, 1), totalPages);
                  onPageChange(clamped);
                }}
                onPageSizeChange={(nextPageSize) => {
                  onPageSizeChange(nextPageSize);
                }}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
