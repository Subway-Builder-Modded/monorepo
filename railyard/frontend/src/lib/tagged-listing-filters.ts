import {
  buildAssetSearchText,
  buildFilteredTaggedListingCounts,
  type FilteredTaggedListingCounts,
  type TaggedListingAccessors,
  type TaggedListingFilterState,
  type TaggedListingItem,
} from '@subway-builder-modded/asset-listings-state';
import { ASSET_LISTING_FUSE_SEARCH_OPTIONS } from '@subway-builder-modded/config';

import type { types } from '../../wailsjs/go/models';

type FrontendListingItem = types.ModManifest | types.MapManifest;
type FrontendMapFilters = Record<string, string[]>;

export type FrontendTaggedListingItem = TaggedListingItem<FrontendListingItem>;

export function buildSearchText<TTaggedItem extends FrontendTaggedListingItem>(
  item: TTaggedItem,
): string {
  return buildAssetSearchText(item, (entry) => entry.author.author_alias ?? '');
}

export function createTaggedListingAccessors<
  TTaggedItem extends FrontendTaggedListingItem,
>(): TaggedListingAccessors<TTaggedItem, FrontendMapFilters> {
  return {
    buildSearchText: (item) => buildSearchText(item),
    dimensions: [
      {
        countKey: 'modTagCounts',
        assetType: 'mod',
        cardinality: 'multi',
        getValue: (item) =>
          item.type === 'mod' ? (item.item.tags ?? []) : undefined,
        getSelected: (filters) => filters.mod.tags,
        filterParent: 'mod',
        filterKey: 'tags',
      },
      {
        countKey: 'mapLocationCounts',
        assetType: 'map',
        cardinality: 'single',
        getValue: (item) =>
          item.type === 'map'
            ? ((item.item as types.MapManifest).location ?? '')
            : undefined,
        getSelected: (filters) => filters.map.locations ?? [],
        filterParent: 'map',
        filterKey: 'locations',
      },
      {
        countKey: 'mapSourceQualityCounts',
        assetType: 'map',
        cardinality: 'single',
        getValue: (item) =>
          item.type === 'map'
            ? ((item.item as types.MapManifest).source_quality ?? '')
            : undefined,
        getSelected: (filters) => filters.map.sourceQuality ?? [],
        filterParent: 'map',
        filterKey: 'sourceQuality',
      },
      {
        countKey: 'mapLevelOfDetailCounts',
        assetType: 'map',
        cardinality: 'single',
        getValue: (item) =>
          item.type === 'map'
            ? ((item.item as types.MapManifest).level_of_detail ?? '')
            : undefined,
        getSelected: (filters) => filters.map.levelOfDetail ?? [],
        filterParent: 'map',
        filterKey: 'levelOfDetail',
      },
      {
        countKey: 'mapSpecialDemandCounts',
        assetType: 'map',
        cardinality: 'multi',
        getValue: (item) =>
          item.type === 'map'
            ? ((item.item as types.MapManifest).special_demand ?? [])
            : undefined,
        getSelected: (filters) => filters.map.specialDemand ?? [],
        filterParent: 'map',
        filterKey: 'specialDemand',
      },
    ],
  };
}

export function buildDimensionCounts<
  TTaggedItem extends FrontendTaggedListingItem,
  TSortState = unknown,
>({
  items,
  filters,
  accessors = createTaggedListingAccessors<TTaggedItem>(),
}: {
  items: TTaggedItem[];
  filters: TaggedListingFilterState<FrontendMapFilters, TSortState>;
  accessors?: TaggedListingAccessors<TTaggedItem, FrontendMapFilters>;
}): FilteredTaggedListingCounts {
  return buildFilteredTaggedListingCounts({
    items,
    filters,
    accessors,
    fuseOptions: ASSET_LISTING_FUSE_SEARCH_OPTIONS,
  });
}
