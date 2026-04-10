import type { AssetType } from '@subway-builder-modded/asset-listings-ui';
import {
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  SidebarFilters as SharedSidebarFilters,
  type SidebarFilterState,
  SidebarPanel as SharedSidebarPanel,
  SOURCE_QUALITY_VALUES,
} from '@subway-builder-modded/asset-listings-ui';
import { MapPin, Package } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';

import { filterVisibleListingValues } from '@/lib/listing-counts';
import { SEARCH_FILTER_EMPTY_LABELS } from '@/lib/search';
import { cn } from '@/lib/utils';
import type { AssetQueryFilters } from '@/stores/asset-query-filter-store';

export interface SidebarFiltersProps {
  filters: AssetQueryFilters;
  onFiltersChange: Dispatch<SetStateAction<AssetQueryFilters>>;
  onTypeChange: (type: AssetType) => void;
  availableTags: string[];
  availableSpecialDemand: string[];
  modTagCounts: Record<string, number>;
  mapLocationCounts: Record<string, number>;
  mapSourceQualityCounts: Record<string, number>;
  mapLevelOfDetailCounts: Record<string, number>;
  mapSpecialDemandCounts: Record<string, number>;
  modCount: number;
  mapCount: number;
}

export interface AssetSidebarPanelProps extends SidebarFiltersProps {
  open: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

const TYPE_BUTTONS: Array<{
  type: AssetType;
  icon: typeof MapPin;
  label: string;
}> = [
  { type: 'map', icon: MapPin, label: 'Show maps' },
  { type: 'mod', icon: Package, label: 'Show mods' },
];

function getNavbarOffsetPx(): number {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--app-navbar-offset',
      ),
    ) - 48 || 72
  );
}

export function AssetSidebarPanel({
  open,
  onToggle,
  ariaLabel,
  ...filterProps
}: AssetSidebarPanelProps) {
  const currentType = filterProps.filters.type;

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

  return (
    <SharedSidebarPanel
      open={open}
      onToggle={onToggle}
      ariaLabel={ariaLabel}
      filters={filterProps.filters}
      collapsedContent={collapsedContent}
      getNavbarOffsetPx={getNavbarOffsetPx}
      getPositionScrollTarget={() => document.getElementById('root')}
      scrollToTop={() =>
        document.getElementById('root')?.scrollTo({ top: 0, behavior: 'auto' })
      }
      scrollClassName="sidebar-scroll"
    >
      <SharedSidebarFilters
        filters={filterProps.filters as SidebarFilterState}
        onFiltersChange={(updater) =>
          filterProps.onFiltersChange(
            (prev) => updater(prev as SidebarFilterState) as AssetQueryFilters,
          )
        }
        onTypeChange={(type) => filterProps.onTypeChange(type as AssetType)}
        availableTags={filterProps.availableTags}
        availableSpecialDemand={filterProps.availableSpecialDemand}
        modTagCounts={filterProps.modTagCounts}
        mapLocationCounts={filterProps.mapLocationCounts}
        mapSourceQualityCounts={filterProps.mapSourceQualityCounts}
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
    </SharedSidebarPanel>
  );
}
