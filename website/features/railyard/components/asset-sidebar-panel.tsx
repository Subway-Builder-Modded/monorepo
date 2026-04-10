'use client';

import { ChevronRight, MapPin, Package, SlidersHorizontal } from 'lucide-react';
import {
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';

import {
  SidebarFilters as SharedSidebarFilters,
  SidebarPanel as SharedSidebarPanel,
  type SidebarFilterState,
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  SOURCE_QUALITY_VALUES,
} from '@subway-builder-modded/asset-listings-ui';
import type { AssetType } from '@subway-builder-modded/asset-listings-ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { SearchFilterState } from '@/hooks/use-filtered-items';
import { filterVisibleListingValues } from '@/lib/railyard/listing-counts';
import { SEARCH_FILTER_EMPTY_LABELS } from '@/lib/railyard/search';
import { cn } from '@subway-builder-modded/shared-ui';

const MOBILE_SIDEBAR_TOP = 'var(--app-navbar-offset, 5.5rem)';

function getNavbarOffsetPx(): number {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--app-navbar-offset',
      ),
    ) || 72
  );
}

function toSharedState(filters: SearchFilterState): SidebarFilterState {
  return {
    type: filters.type,
    mod: {
      tags: filters.mod.tags,
    },
    map: {
      locations: filters.map.locations,
      sourceQuality: filters.map.dataQuality,
      levelOfDetail: filters.map.levelOfDetail,
      specialDemand: filters.map.specialDemand,
    },
  };
}

export interface SidebarFiltersProps {
  filters: SearchFilterState;
  onFiltersChange: Dispatch<SetStateAction<SearchFilterState>>;
  onTypeChange: (type: AssetType) => void;
  availableTags: string[];
  availableSpecialDemand: string[];
  modTagCounts: Record<string, number>;
  mapLocationCounts: Record<string, number>;
  mapDataQualityCounts: Record<string, number>;
  mapLevelOfDetailCounts: Record<string, number>;
  mapSpecialDemandCounts: Record<string, number>;
  modCount: number;
  mapCount: number;
}

export interface AssetSidebarPanelProps extends SidebarFiltersProps {
  open: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  ariaLabel?: string;
}

const TYPE_BUTTONS: Array<{
  type: AssetType;
  icon: typeof MapPin;
  label: string;
}> = [
  { type: 'map', icon: MapPin, label: 'Show maps' },
  { type: 'mod', icon: Package, label: 'Show mods' },
];

export function AssetSidebarPanel({
  open,
  onToggle,
  mobileOpen = false,
  onMobileOpenChange,
  ariaLabel = 'Browse filters',
  ...filterProps
}: AssetSidebarPanelProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const currentType = filterProps.filters.type;

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const filtersContent = (
    <SharedSidebarFilters
      filters={toSharedState(filterProps.filters)}
      onFiltersChange={(updater) =>
        filterProps.onFiltersChange((prev) => {
          const next = updater(toSharedState(prev));
          return {
            ...prev,
            type: next.type,
            mod: {
              ...prev.mod,
              tags: next.mod.tags,
            },
            map: {
              ...prev.map,
              locations: next.map.locations,
              dataQuality: next.map.sourceQuality,
              levelOfDetail: next.map.levelOfDetail,
              specialDemand: next.map.specialDemand,
            },
          };
        })
      }
      onTypeChange={(type) => filterProps.onTypeChange(type as AssetType)}
      availableTags={filterProps.availableTags}
      availableSpecialDemand={filterProps.availableSpecialDemand}
      modTagCounts={filterProps.modTagCounts}
      mapLocationCounts={filterProps.mapLocationCounts}
      mapSourceQualityCounts={filterProps.mapDataQualityCounts}
      mapLevelOfDetailCounts={filterProps.mapLevelOfDetailCounts}
      mapSpecialDemandCounts={filterProps.mapSpecialDemandCounts}
      modCount={filterProps.modCount}
      mapCount={filterProps.mapCount}
      locationValues={LOCATION_TAGS}
      sourceQualityValues={SOURCE_QUALITY_VALUES}
      levelOfDetailValues={LEVEL_OF_DETAIL_VALUES}
      formatSourceQuality={formatSourceQuality}
      filterVisibleListingValues={filterVisibleListingValues}
      emptyLabels={SEARCH_FILTER_EMPTY_LABELS}
    />
  );

  const collapsedContent = (
    <>
      {TYPE_BUTTONS.map(({ type, icon: Icon, label }) => {
        const isCurrent = currentType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => filterProps.onTypeChange(type)}
            aria-label={label}
            aria-current={isCurrent ? 'true' : undefined}
            className={cn(
              'relative flex h-10 w-full items-center justify-center transition-colors',
              'hover:bg-accent/45 hover:text-primary',
              isCurrent ? 'text-primary' : '',
            )}
          >
            <Icon className="h-4 w-4" />
            {isCurrent && (
              <span
                aria-hidden
                className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </>
  );

  if (isMobile === null) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet
        isOpen={mobileOpen}
        onOpenChange={onMobileOpenChange ?? (() => {})}
      >
        <SheetContent
          side="left"
          closeButton={false}
          isFloat={false}
          overlayClassName="bg-black/10 backdrop-blur-sm"
          className={cn(
            'railyard-accent',
            'inset-y-auto h-[calc(100svh-var(--browse-mobile-sidebar-top))]',
            'w-72 max-w-none bg-background p-0',
            'entering:duration-200 entering:ease-out exiting:duration-160 exiting:ease-in',
            '[&>button]:hidden',
          )}
          style={
            {
              '--browse-mobile-sidebar-top': MOBILE_SIDEBAR_TOP,
              top: MOBILE_SIDEBAR_TOP,
            } as CSSProperties
          }
          aria-label={ariaLabel}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Browse filters</SheetTitle>
            <SheetDescription>Filter browse results</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-[clamp(0.65rem,1.4vw,1rem)] py-[clamp(0.42rem,0.88vw,0.6rem)]">
              <div className="flex flex-1 items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-[clamp(0.78rem,0.92vw,0.88rem)] font-semibold text-muted-foreground">
                  Filters
                </span>
              </div>
              <button
                type="button"
                onClick={() => onMobileOpenChange?.(false)}
                aria-label="Close filters"
                className="mr-[-0.15rem] translate-x-0.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/45 hover:text-primary"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-clip px-[clamp(0.65rem,1.4vw,1rem)] py-3">
              {filtersContent}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <SharedSidebarPanel
      open={open}
      onToggle={onToggle}
      ariaLabel={ariaLabel}
      filters={filterProps.filters}
      collapsedContent={collapsedContent}
      getNavbarOffsetPx={getNavbarOffsetPx}
      getMainElement={() =>
        document.querySelector<HTMLElement>('[data-sidebar-host]') ??
        document.querySelector<HTMLElement>('main')
      }
      getFooterElement={() =>
        document.querySelector<HTMLElement>('#site-footer')
      }
      getPositionScrollTarget={() => window}
      scrollToTop={() => window.scrollTo({ top: 0, behavior: 'auto' })}
      scrollClassName="sidebar-scroll"
    >
      {filtersContent}
    </SharedSidebarPanel>
  );
}
