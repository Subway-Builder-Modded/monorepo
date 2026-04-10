import {
  SidebarFilters as SharedSidebarFilters,
  type SidebarFilterState,
} from '@subway-builder-modded/asset-listings-ui';
import { type Dispatch, type SetStateAction } from 'react';

import type { AssetType } from '@/lib/asset-types';
import { filterVisibleListingValues } from '@/lib/listing-counts';
import {
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  SOURCE_QUALITY_VALUES,
} from '@/lib/map-filter-values';
import { SEARCH_FILTER_EMPTY_LABELS } from '@/lib/search';
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

export function SidebarFilters({
  filters,
  onFiltersChange,
  onTypeChange,
  availableTags,
  availableSpecialDemand,
  modTagCounts,
  mapLocationCounts,
  mapSourceQualityCounts,
  mapLevelOfDetailCounts,
  mapSpecialDemandCounts,
  modCount,
  mapCount,
}: SidebarFiltersProps) {
  return (
    <SharedSidebarFilters
      filters={filters as SidebarFilterState}
      onFiltersChange={(updater) =>
        onFiltersChange(
          (prev) => updater(prev as SidebarFilterState) as AssetQueryFilters,
        )
      }
      onTypeChange={(type) => onTypeChange(type as AssetType)}
      availableTags={availableTags}
      availableSpecialDemand={availableSpecialDemand}
      modTagCounts={modTagCounts}
      mapLocationCounts={mapLocationCounts}
      mapSourceQualityCounts={mapSourceQualityCounts}
      mapLevelOfDetailCounts={mapLevelOfDetailCounts}
      mapSpecialDemandCounts={mapSpecialDemandCounts}
      modCount={modCount}
      mapCount={mapCount}
      locationValues={LOCATION_TAGS}
      sourceQualityValues={SOURCE_QUALITY_VALUES}
      levelOfDetailValues={LEVEL_OF_DETAIL_VALUES}
      formatSourceQuality={formatSourceQuality}
      filterVisibleListingValues={filterVisibleListingValues}
      emptyLabels={SEARCH_FILTER_EMPTY_LABELS}
    />
  );
}
