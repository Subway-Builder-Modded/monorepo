'use client';

import {
  SidebarFilters as SharedSidebarFilters,
  type SidebarFilterState,
} from '@subway-builder-modded/asset-listings-ui';
import type { Dispatch, SetStateAction } from 'react';

import type { SearchFilterState } from '@/hooks/use-filtered-items';
import type { AssetType } from '@/lib/railyard/asset-types';
import { filterVisibleListingValues } from '@/lib/railyard/listing-counts';
import {
  DATA_QUALITY_VALUES,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  formatDataQuality,
} from '@/lib/railyard/map-filter-values';
import { SEARCH_FILTER_EMPTY_LABELS } from '@/lib/railyard/search';

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

export function SidebarFilters({
  filters,
  onFiltersChange,
  onTypeChange,
  availableTags,
  availableSpecialDemand,
  modTagCounts,
  mapLocationCounts,
  mapDataQualityCounts,
  mapLevelOfDetailCounts,
  mapSpecialDemandCounts,
  modCount,
  mapCount,
}: SidebarFiltersProps) {
  return (
    <SharedSidebarFilters
      filters={toSharedState(filters)}
      onFiltersChange={(updater) =>
        onFiltersChange((prev) => {
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
      onTypeChange={(type) => onTypeChange(type as AssetType)}
      availableTags={availableTags}
      availableSpecialDemand={availableSpecialDemand}
      modTagCounts={modTagCounts}
      mapLocationCounts={mapLocationCounts}
      mapSourceQualityCounts={mapDataQualityCounts}
      mapLevelOfDetailCounts={mapLevelOfDetailCounts}
      mapSpecialDemandCounts={mapSpecialDemandCounts}
      modCount={modCount}
      mapCount={mapCount}
      locationValues={LOCATION_TAGS}
      sourceQualityValues={DATA_QUALITY_VALUES}
      levelOfDetailValues={LEVEL_OF_DETAIL_VALUES}
      formatSourceQuality={formatDataQuality}
      filterVisibleListingValues={filterVisibleListingValues}
      emptyLabels={SEARCH_FILTER_EMPTY_LABELS}
    />
  );
}
