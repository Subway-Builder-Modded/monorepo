'use client';

import { Compass, SearchX, SlidersHorizontal } from 'lucide-react';
import React, {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  AssetSidebarPanel,
  SIDEBAR_CONTENT_OFFSET,
} from '@/features/railyard/components/asset-sidebar-panel';
import { CardSkeletonGrid } from '@/features/railyard/components/card-skeleton-grid';
import { EmptyState } from '@/features/railyard/components/empty-state';
import { ErrorBanner } from '@/features/railyard/components/error-banner';
import { ItemCard } from './item-card';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/features/railyard/components/pagination';
import { SearchBar } from '@/features/railyard/components/search-bar';
import { SortSelect } from '@/features/railyard/components/sort-select';
import { ViewModeToggle } from '@/features/railyard/components/view-mode-toggle';
import { createRandomSeed, useFilteredItems } from '@/hooks/use-filtered-items';
import { useIsMobile } from '@/hooks/use-mobile';
import { preloadGalleryImage } from '@/hooks/use-gallery-image';
import { useRegistry } from '@/hooks/use-registry';
import { buildAssetListingCounts } from '@/lib/railyard/listing-counts';
import { buildSpecialDemandValues } from '@/lib/railyard/map-filter-values';
import {
  normalizeSearchViewMode,
  type SearchViewMode,
} from '@/lib/railyard/search-view-mode';
import { cn } from '@/lib/utils';

const VIEW_MODE_STORAGE_KEY = 'railyard:browse:view-mode:v1';
const SIDEBAR_OPEN_KEY = 'railyard:browse:sidebar-open:v1';

function normalizeType(value: string | null): 'mod' | 'map' | undefined {
  if (value === 'mod' || value === 'map') return value;
  if (value === 'mods') return 'mod';
  if (value === 'maps') return 'map';
  return undefined;
}

export function BrowsePage() {
  const { mods, maps, loading, error, modDownloadTotals, mapDownloadTotals } =
    useRegistry();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryType = normalizeType(searchParams.get('type'));

  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(SIDEBAR_OPEN_KEY);
    return stored !== 'false';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  const [viewMode, setViewMode] = useState<SearchViewMode>(() => {
    if (typeof window === 'undefined') return 'full';
    return normalizeSearchViewMode(
      window.localStorage.getItem(VIEW_MODE_STORAGE_KEY),
      'full',
    );
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const allTags = useMemo(() => {
    const modTags = mods.flatMap((manifest) => manifest.tags ?? []);
    return [...new Set(modTags)].sort();
  }, [mods]);

  const availableSpecialDemand = useMemo(
    () => buildSpecialDemandValues(maps),
    [maps],
  );

  const {
    modTagCounts,
    mapLocationCounts,
    mapDataQualityCounts,
    mapLevelOfDetailCounts,
    mapSpecialDemandCounts,
  } = useMemo(() => buildAssetListingCounts(mods, maps), [mods, maps]);

  const {
    items,
    page,
    totalPages,
    totalResults,
    filters,
    setFilters,
    setType,
    setPage,
  } = useFilteredItems({
    mods,
    maps,
    modDownloadTotals,
    mapDownloadTotals,
    initialType: queryType,
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', filters.type);

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    }
  }, [filters.type, pathname, router, searchParams]);

  useEffect(() => {
    if (loading || items.length === 0) return;
    void Promise.allSettled(
      items.map(({ type: itemType, item }) =>
        preloadGalleryImage(
          itemType === 'mod' ? 'mods' : 'maps',
          item.id,
          item.gallery?.[0],
        ),
      ),
    );
  }, [items, loading]);

  const resultsLayoutClassName = useMemo(() => {
    if (viewMode === 'list') return 'space-y-4';
    if (viewMode === 'compact') {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';
    }
    return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';
  }, [viewMode]);

  if (!isClient) {
    return (
      <div className="space-y-5">
        <PageHeader
          icon={Compass}
          title="Browse"
          description="Discover and install community-made content for Subway Builder."
        />
        <CardSkeletonGrid count={12} />
      </div>
    );
  }

  return (
    <div className="relative isolate">
      <AssetSidebarPanel
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onTypeChange={setType}
        availableTags={allTags}
        availableSpecialDemand={availableSpecialDemand}
        modTagCounts={modTagCounts}
        mapLocationCounts={mapLocationCounts}
        mapDataQualityCounts={mapDataQualityCounts}
        mapLevelOfDetailCounts={mapLevelOfDetailCounts}
        mapSpecialDemandCounts={mapSpecialDemandCounts}
        modCount={mods.length}
        mapCount={maps.length}
      />

      <div
        className={cn(
          'relative z-10 space-y-5 transition-[padding-left] duration-200 ease-out',
          sidebarOpen && !isMobile
            ? 'md:pl-[var(--browse-sidebar-offset)]'
            : '',
        )}
        style={
          {
            '--browse-sidebar-offset': SIDEBAR_CONTENT_OFFSET,
            minHeight: 'calc(100vh - var(--app-navbar-offset))',
          } as React.CSSProperties
        }
      >
        <PageHeader
          icon={Compass}
          title="Browse"
          description="Discover and install community-made content for Subway Builder."
        />

        {error && <ErrorBanner message={error} />}

        <SearchBar
          query={filters.query}
          onQueryChange={(value) =>
            setFilters((prev) => ({ ...prev, query: value }))
          }
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/90 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-accent/45 hover:text-primary"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                Filters
              </button>
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted" />
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {totalResults}
                    </span>{' '}
                    result{totalResults !== 1 ? 's' : ''}
                    {filters.query && (
                      <span className="ml-1">
                        for{' '}
                        <span className="italic">
                          &quot;{filters.query}&quot;
                        </span>
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
              <SortSelect
                value={filters.sort}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    sort: value,
                    randomSeed:
                      value.field === 'random'
                        ? createRandomSeed()
                        : prev.randomSeed,
                  }))
                }
                tab={filters.type}
              />
            </div>
          </div>

          {loading ? (
            <CardSkeletonGrid count={filters.perPage} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No results found"
              description={
                filters.query
                  ? `No items match "${filters.query}"`
                  : 'No items match the current filters'
              }
            />
          ) : (
            <>
              <div className={cn(resultsLayoutClassName)}>
                {items.map(({ type: itemType, item }) => (
                  <ItemCard
                    key={`${itemType}-${item.id}`}
                    type={itemType}
                    item={item}
                    viewMode={viewMode}
                    totalDownloads={
                      itemType === 'mod'
                        ? (modDownloadTotals[item.id] ?? 0)
                        : (mapDownloadTotals[item.id] ?? 0)
                    }
                  />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalResults={totalResults}
                perPage={filters.perPage}
                onPageChange={setPage}
                onPerPageChange={(value) =>
                  setFilters((prev) => ({ ...prev, perPage: value }))
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
