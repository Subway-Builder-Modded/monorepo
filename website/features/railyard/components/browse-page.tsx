'use client';

import {
  Calendar,
  Compass,
  Download,
  Globe,
  Hash,
  Shuffle,
  SlidersHorizontal,
  Type,
  User,
  Users,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BrowsePageShell,
  BrowseResultsSection,
  CardSkeletonGrid,
  DEFAULT_FIELD_ICONS,
  ErrorBanner,
  getSortFieldOptions,
  Pagination,
  ResultsSummary,
  SearchBar,
  SIDEBAR_CONTENT_OFFSET,
  SidebarFilters,
  type SidebarFilterState,
  SortSelect as SharedSortSelect,
  ViewModeToggle,
  type SortState as SharedSortState,
} from '@subway-builder-modded/asset-listings-ui';

import { SidebarPanel } from '@/features/railyard/components/sidebar-panel';
import { ItemCard } from './item-card';
import { createRandomSeed } from '@subway-builder-modded/stores-core';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFilteredItems } from '@/hooks/use-filtered-items';
import { useIsMobile } from '@/hooks/use-mobile';
import { preloadGalleryImage } from '@/hooks/use-gallery-image';
import { useRegistry } from '@/hooks/use-registry';
import {
  buildAssetListingCounts as buildSharedAssetListingCounts,
  DEFAULT_SORT_STATE,
  filterVisibleListingValues,
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  PER_PAGE_OPTIONS,
  buildSpecialDemandValues,
  SEARCH_BAR_PLACEHOLDER,
  SEARCH_FILTER_EMPTY_LABELS,
  SOURCE_QUALITY_VALUES,
  type SortField,
  TEXT_SORT_FIELDS,
} from '@subway-builder-modded/config';
import {
  normalizeSearchViewMode,
  type SearchViewMode,
} from '@subway-builder-modded/config';
import { cn, PageHeading } from '@subway-builder-modded/shared-ui';

const VIEW_MODE_STORAGE_KEY = 'railyard:browse:view-mode:v1';
const SIDEBAR_OPEN_KEY = 'railyard:browse:sidebar-open:v1';

const FIELD_ICONS: Record<string, typeof Type> = {
  ...DEFAULT_FIELD_ICONS,
  name: Type,
  city_code: Hash,
  country: Globe,
  author: User,
  population: Users,
  downloads: Download,
  last_updated: Calendar,
  random: Shuffle,
};

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
    mapSourceQualityCounts,
    mapLevelOfDetailCounts,
    mapSpecialDemandCounts,
  } = useMemo(() => buildSharedAssetListingCounts(mods, maps), [mods, maps]);

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

  const sortFieldOptions = useMemo(
    () => getSortFieldOptions(filters.type),
    [filters.type],
  );

  const handleSidebarFiltersChange = useCallback(
    (updater: (prev: SidebarFilterState) => SidebarFilterState) => {
      setFilters((prev) => {
        const next = updater({
          type: prev.type,
          mod: { tags: prev.mod.tags },
          map: {
            locations: prev.map.locations,
            sourceQuality: prev.map.sourceQuality,
            levelOfDetail: prev.map.levelOfDetail,
            specialDemand: prev.map.specialDemand,
          },
        });
        return {
          ...prev,
          type: next.type,
          mod: { ...prev.mod, tags: next.mod.tags },
          map: {
            ...prev.map,
            locations: next.map.locations,
            sourceQuality: next.map.sourceQuality,
            levelOfDetail: next.map.levelOfDetail,
            specialDemand: next.map.specialDemand,
          },
        };
      });
    },
    [setFilters],
  );

  useEffect(() => {
    if (!sortFieldOptions.some((f) => f.field === filters.sort.field)) {
      setFilters((prev) => ({ ...prev, sort: DEFAULT_SORT_STATE }));
    }
  }, [filters.sort.field, setFilters, sortFieldOptions]);

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

  if (!isClient) {
    return (
      <div className="space-y-5">
        <PageHeading
          icon={Compass}
          title="Browse"
          description="Discover and install community-made content for Subway Builder."
        />
        <CardSkeletonGrid count={12} />
      </div>
    );
  }

  return (
    <BrowsePageShell
      sidebar={{
        open: sidebarOpen,
        onToggle: () => setSidebarOpen(!sidebarOpen),
        ariaLabel: 'Browse filters',
        currentType: filters.type,
        filters,
        onTypeChange: setType,
        renderPanel: ({
          open,
          onToggle,
          ariaLabel,
          filters,
          collapsedContent,
          children,
        }) => (
          <SidebarPanel
            open={open}
            onToggle={onToggle}
            ariaLabel={ariaLabel}
            filters={filters}
            collapsedContent={collapsedContent}
            mobileOpen={mobileSidebarOpen}
            onMobileOpenChange={setMobileSidebarOpen}
          >
            {children}
          </SidebarPanel>
        ),
        content: (
          <SidebarFilters
            filters={filters}
            onFiltersChange={handleSidebarFiltersChange}
            onTypeChange={setType}
            availableTags={allTags}
            availableSpecialDemand={availableSpecialDemand}
            modTagCounts={modTagCounts}
            mapLocationCounts={mapLocationCounts}
            mapSourceQualityCounts={mapSourceQualityCounts}
            mapLevelOfDetailCounts={mapLevelOfDetailCounts}
            mapSpecialDemandCounts={mapSpecialDemandCounts}
            modCount={mods.length}
            mapCount={maps.length}
            locationValues={LOCATION_TAGS}
            sourceQualityValues={SOURCE_QUALITY_VALUES}
            levelOfDetailValues={LEVEL_OF_DETAIL_VALUES}
            formatSourceQuality={formatSourceQuality}
            filterVisibleListingValues={filterVisibleListingValues}
            emptyLabels={SEARCH_FILTER_EMPTY_LABELS}
          />
        ),
      }}
      content={{
        className: cn(
          'transition-[padding-left] duration-200 ease-out',
          sidebarOpen && !isMobile
            ? 'md:pl-[var(--browse-sidebar-offset)]'
            : '',
        ),
        style: {
          '--browse-sidebar-offset': SIDEBAR_CONTENT_OFFSET,
          minHeight: 'calc(100vh - var(--app-navbar-offset))',
        } as React.CSSProperties,
        header: (
          <PageHeading
            icon={Compass}
            title="Browse"
            description="Discover and install community-made content for Subway Builder."
          />
        ),
        error: error ? <ErrorBanner message={error} /> : undefined,
        search: (
          <SearchBar
            query={filters.query}
            onQueryChange={(value) =>
              setFilters((prev) => ({ ...prev, query: value }))
            }
            placeholder={SEARCH_BAR_PLACEHOLDER}
            ariaLabel="Search mods and maps"
          />
        ),
        controlsLeft: (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/90 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-accent/45 hover:text-primary"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              Filters
            </button>
            <ResultsSummary
              totalResults={totalResults}
              query={filters.query}
              loading={loading}
            />
          </div>
        ),
        controlsRight: (
          <div className="flex items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <SharedSortSelect
              value={filters.sort as SharedSortState}
              onChange={(next) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: {
                    field: next.field as SortField,
                    direction: next.direction,
                  },
                  randomSeed:
                    next.field === 'random'
                      ? createRandomSeed()
                      : prev.randomSeed,
                }))
              }
              fieldOptions={sortFieldOptions}
              textSortFields={Array.from(TEXT_SORT_FIELDS)}
              fieldIcons={FIELD_ICONS}
            />
          </div>
        ),
        body: (
          <BrowseResultsSection
            loading={loading}
            items={items}
            query={filters.query}
            viewMode={viewMode}
            skeletonCount={filters.perPage}
            renderItem={({ type: itemType, item }) => (
              <ItemCard
                key={`${itemType}-${item.id}`}
                type={itemType}
                item={item}
                viewMode={viewMode}
                descriptionMode="preview"
                totalDownloads={
                  itemType === 'mod'
                    ? (modDownloadTotals[item.id] ?? 0)
                    : (mapDownloadTotals[item.id] ?? 0)
                }
              />
            )}
            pagination={
              <Pagination
                page={page}
                totalPages={totalPages}
                totalResults={totalResults}
                perPage={filters.perPage}
                perPageOptions={PER_PAGE_OPTIONS}
                onPageChange={setPage}
                onPerPageChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    perPage: value as (typeof prev)['perPage'],
                  }))
                }
                renderPerPageControl={({ value, options, onChange }) => (
                  <Select
                    value={String(value)}
                    onValueChange={(v) => onChange(Number(v))}
                  >
                    <SelectTrigger className="w-16 h-7 text-xs" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem
                          key={opt}
                          value={String(opt)}
                          className="text-xs"
                        >
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            }
          />
        ),
      }}
    />
  );
}
