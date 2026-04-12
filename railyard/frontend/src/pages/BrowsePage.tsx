import {
  BrowsePageShell,
  BrowseResultsSection,
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
  type SortState as SharedSortState,
  ViewModeToggle,
} from '@subway-builder-modded/asset-listings-ui';
import type { AssetType } from '@subway-builder-modded/config';
import {
  buildAssetListingCounts,
  buildSpecialDemandValues,
  DEFAULT_SORT_STATE,
  filterVisibleListingValues,
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  SEARCH_BAR_PLACEHOLDER,
  SEARCH_FILTER_EMPTY_LABELS,
  type SortField,
  SOURCE_QUALITY_VALUES,
  TEXT_SORT_FIELDS,
} from '@subway-builder-modded/config';
import { PER_PAGE_OPTIONS } from '@subway-builder-modded/config';
import { usePageWarmup } from '@subway-builder-modded/lifecycle-core';
import { PageHeading, PageLoadScreen } from '@subway-builder-modded/shared-ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@subway-builder-modded/shared-ui';
import {
  Calendar,
  Compass,
  Download,
  Globe,
  Hash,
  Shuffle,
  Type,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ItemCard } from '@/components/shared/ItemCard';
import { SidebarPanel } from '@/components/shared/SidebarPanel';
import { useFilteredItems } from '@/hooks/use-filtered-items';
import { preloadGalleryImage } from '@/hooks/use-gallery-image';
import { createRandomSeed, useBrowseStore } from '@/stores/browse-store';
import { useInstalledStore } from '@/stores/installed-store';
import { useProfileStore } from '@/stores/profile-store';
import { useRegistryStore } from '@/stores/registry-store';
import { useUIStore } from '@/stores/ui-store';

interface BrowsePageContentProps {
  warmupMode: boolean;
  onWarmupComplete: () => void;
}

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

function BrowsePageContent({
  warmupMode,
  onWarmupComplete,
}: BrowsePageContentProps) {
  const sidebarOpen = useUIStore((s) => s.browseSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setBrowseSidebarOpen);
  const warmupCompleteRef = useRef(false);

  const viewMode = useBrowseStore((s) => s.viewMode);
  const setViewMode = useBrowseStore((s) => s.setViewMode);
  const initializeViewMode = useBrowseStore((s) => s.initializeViewMode);
  const defaultBrowseViewMode = useProfileStore((s) => s.searchViewMode());

  const mods = useRegistryStore((s) => s.mods);
  const maps = useRegistryStore((s) => s.maps);
  const loading = useRegistryStore((s) => s.loading);
  const error = useRegistryStore((s) => s.error);
  const modDownloadTotals = useRegistryStore((s) => s.modDownloadTotals);
  const mapDownloadTotals = useRegistryStore((s) => s.mapDownloadTotals);
  const ensureDownloadTotals = useRegistryStore((s) => s.ensureDownloadTotals);
  const installedMaps = useInstalledStore((s) => s.installedMaps);
  const installedMods = useInstalledStore((s) => s.installedMods);

  const modManifestById = useMemo(
    () => new Map(mods.map((manifest) => [manifest.id, manifest])),
    [mods],
  );
  const mapManifestById = useMemo(
    () => new Map(maps.map((manifest) => [manifest.id, manifest])),
    [maps],
  );

  const installedItems = useMemo(() => {
    const items: Array<{
      type: AssetType;
      item: (typeof mods)[number] | (typeof maps)[number];
      installedVersion: string;
    }> = [];
    for (const installed of installedMods) {
      const manifest = modManifestById.get(installed.id);
      if (manifest)
        items.push({
          type: 'mod',
          item: manifest,
          installedVersion: installed.version,
        });
    }
    for (const installed of installedMaps) {
      const manifest = mapManifestById.get(installed.id);
      if (manifest)
        items.push({
          type: 'map',
          item: manifest,
          installedVersion: installed.version,
        });
    }
    return items;
  }, [installedMaps, installedMods, mapManifestById, modManifestById]);

  const installedVersionByItemKey = useMemo(
    () =>
      new Map(
        installedItems.map((e) => [
          `${e.type}-${e.item.id}`,
          e.installedVersion,
        ]),
      ),
    [installedItems],
  );

  const allTags = useMemo(() => {
    const modTags = mods.flatMap((m) => m.tags ?? []);
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
  } = useMemo(() => buildAssetListingCounts(mods, maps), [mods, maps]);

  useEffect(() => {
    ensureDownloadTotals();
  }, [ensureDownloadTotals]);

  useEffect(() => {
    initializeViewMode(defaultBrowseViewMode);
  }, [defaultBrowseViewMode, initializeViewMode]);

  const {
    items,
    page,
    totalPages,
    totalResults,
    filters,
    setFilters,
    setType,
    setPage,
  } = useFilteredItems({ mods, maps, modDownloadTotals, mapDownloadTotals });

  const sortFieldOptions = useMemo(
    () => getSortFieldOptions(filters.type),
    [filters.type],
  );

  const cardGridPreset = useMemo(
    () => (viewMode === 'compact' ? 'compact' : 'default'),
    [viewMode],
  );

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [setSidebarOpen, sidebarOpen]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setFilters((prev) => ({ ...prev, query: value }));
    },
    [setFilters],
  );

  const handleSortChange = useCallback(
    (value: (typeof filters)['sort']) => {
      setFilters((prev) => ({
        ...prev,
        sort: value,
        randomSeed:
          value.field === 'random' ? createRandomSeed() : prev.randomSeed,
      }));
    },
    [setFilters],
  );

  const handlePerPageChange = useCallback(
    (value: (typeof filters)['perPage']) => {
      setFilters((prev) => ({ ...prev, perPage: value }));
    },
    [setFilters],
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
    if (loading) {
      warmupCompleteRef.current = false;
    }
  }, [loading]);

  const warmupTasks = useMemo(
    () =>
      items.map(
        ({ type, item }) =>
          () =>
            preloadGalleryImage(type, item.id, item.gallery?.[0]),
      ),
    [items],
  );

  usePageWarmup({
    enabled: warmupMode && !loading && !warmupCompleteRef.current,
    warmupTasks,
    onReady: () => {
      warmupCompleteRef.current = true;
      onWarmupComplete();
    },
  });

  return (
    <BrowsePageShell
      sidebar={{
        open: sidebarOpen,
        onToggle: handleSidebarToggle,
        ariaLabel: 'Browse filters',
        filters,
        currentType: filters.type,
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
        style: {
          paddingLeft: sidebarOpen ? SIDEBAR_CONTENT_OFFSET : '0px',
          transition: 'padding-left 200ms ease-out',
          minHeight: 'calc(100vh - var(--app-navbar-offset))',
        },
        header: (
          <PageHeading
            icon={Compass}
            title="Browse"
            description="Discover and install maps and mods for Subway Builder."
          />
        ),
        error: error ? <ErrorBanner message={error} /> : undefined,
        search: (
          <SearchBar
            query={filters.query}
            onQueryChange={handleQueryChange}
            placeholder={SEARCH_BAR_PLACEHOLDER}
            ariaLabel="Search mods and maps"
          />
        ),
        controlsLeft: (
          <ResultsSummary
            totalResults={totalResults}
            query={filters.query}
            loading={loading}
          />
        ),
        controlsRight: (
          <div className="flex items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <SharedSortSelect
              value={filters.sort as SharedSortState}
              onChange={(next) =>
                handleSortChange({
                  field: next.field as SortField,
                  direction: next.direction,
                })
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
            gridPreset={cardGridPreset}
            renderItem={({ type: itemType, item }) => (
              <ItemCard
                key={`${itemType}-${item.id}`}
                type={itemType}
                item={item}
                viewMode={viewMode}
                descriptionMode="preview"
                installedVersion={installedVersionByItemKey.get(
                  `${itemType}-${item.id}`,
                )}
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
                  handlePerPageChange(value as (typeof filters)['perPage'])
                }
                renderPerPageControl={({ value, options, onChange }) => (
                  <Select
                    value={String(value)}
                    onValueChange={(v) => onChange(Number(v))}
                  >
                    <SelectTrigger className="w-16 h-7 text-xs">
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

export function BrowsePage() {
  const loading = useRegistryStore((s) => s.loading);
  const [warmupReady, setWarmupReady] = useState(false);

  useEffect(() => {
    if (loading) {
      setWarmupReady(false);
    }
  }, [loading]);

  const handleWarmupComplete = useCallback(() => {
    setWarmupReady(true);
  }, []);

  const showLoader = loading || !warmupReady;

  return (
    <>
      <div
        aria-hidden={showLoader}
        className={showLoader ? 'pointer-events-none opacity-0' : undefined}
      >
        <BrowsePageContent
          warmupMode={showLoader}
          onWarmupComplete={handleWarmupComplete}
        />
      </div>

      {showLoader && (
        <PageLoadScreen
          title="Loading Browse"
          description="Preparing sidebar, cards, and thumbnails..."
        />
      )}
    </>
  );
}
