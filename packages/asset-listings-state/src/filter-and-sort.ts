import Fuse, { type IFuseOptions } from 'fuse.js';

import {
  ASSET_LISTING_FUSE_SEARCH_OPTIONS,
  type AssetType,
  type PerPage,
  type SortState,
} from '@subway-builder-modded/config';

type SearchableItem<TItem> = {
  entry: TItem;
  searchText: string;
};

export interface TaggedListingItem<TItem = { id: string }> {
  type: AssetType;
  item: TItem;
}

export interface AssetSearchable {
  name?: string | null;
  description?: string | null;
  tags?: string[] | null;
  city_code?: string | null;
  country?: string | null;
  location?: string | null;
  source_quality?: string | null;
  level_of_detail?: string | null;
  special_demand?: string[] | null;
}

export function buildAssetSearchText<TItem extends AssetSearchable>(
  tagged: TaggedListingItem<TItem>,
  getAuthorText: (item: TItem) => string,
): string {
  const item = tagged.item;
  const values: string[] = [
    item.name ?? '',
    getAuthorText(item),
    item.description ?? '',
  ];

  if (tagged.type === 'mod') {
    values.push(...(item.tags ?? []));
  } else {
    values.push(
      item.city_code ?? '',
      item.country ?? '',
      item.location ?? '',
      item.source_quality ?? '',
      item.level_of_detail ?? '',
      ...(item.special_demand ?? []),
    );
  }

  return values.filter(Boolean).join(' ');
}

export interface TaggedListingFilterState<TMapFilters, TSortState = SortState> {
  query: string;
  type: AssetType;
  sort: TSortState;
  randomSeed: number;
  perPage: PerPage;
  mod: {
    tags: string[];
  };
  map: TMapFilters;
}

export interface TaggedListingAccessors<TItem, TMapFilters> {
  buildSearchText: (item: TItem) => string;
  getModTags: (item: TItem) => string[] | undefined;
  getMapLocation: (item: TItem) => string | undefined;
  getMapQuality: (item: TItem, filters: TMapFilters) => string | undefined;
  getSelectedMapQuality: (filters: TMapFilters) => string[];
  getMapLevelOfDetail: (item: TItem) => string | undefined;
  getSelectedMapLevelOfDetail: (filters: TMapFilters) => string[];
  getMapSpecialDemand: (item: TItem) => string[] | undefined;
  getSelectedMapSpecialDemand: (filters: TMapFilters) => string[];
  getSelectedMapLocations: (filters: TMapFilters) => string[];
}

export interface FilterAndSortTaggedItemsParams<
  TTaggedItem extends TaggedListingItem,
  TMapFilters,
  TSortState = SortState,
> {
  items: TTaggedItem[];
  filters: TaggedListingFilterState<TMapFilters, TSortState>;
  modDownloadTotals: Record<string, number>;
  mapDownloadTotals: Record<string, number>;
  compareItems: (
    left: TTaggedItem,
    right: TTaggedItem,
    sort: TSortState,
    modDownloadTotals: Record<string, number>,
    mapDownloadTotals: Record<string, number>,
  ) => number;
  accessors: TaggedListingAccessors<TTaggedItem, TMapFilters>;
  fuseOptions?: IFuseOptions<SearchableItem<TTaggedItem>>;
}

export interface FilterAndPaginateTaggedItemsParams<
  TTaggedItem extends TaggedListingItem,
  TMapFilters,
  TSortState = SortState,
> extends FilterAndSortTaggedItemsParams<TTaggedItem, TMapFilters, TSortState> {
  page: number;
}

export interface FilteredPageResult<TTaggedItem> {
  filtered: TTaggedItem[];
  items: TTaggedItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export function matchesSingleValueFilter(
  value: string | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  if (!value) return false;
  return selected.includes(value);
}

export function matchesZeroOrManyValuesFilter(
  values: string[] | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  if (!values || values.length === 0) return false;
  return selected.some((tag) => values.includes(tag));
}

export function seededHash(value: string, seed: number): number {
  const FNV_OFFSET_BASIS_32 = 0x811c9dc5;
  const FNV_PRIME_32 = 0x01000193;

  let hash = (seed ^ FNV_OFFSET_BASIS_32) >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME_32) >>> 0;
  }
  return hash;
}

export function sortItemsBySeed<TTaggedItem extends TaggedListingItem>(
  items: TTaggedItem[],
  seed: number,
): TTaggedItem[] {
  return [...items].sort((left, right) => {
    const leftHash = seededHash(`${left.type}:${left.item.id}`, seed);
    const rightHash = seededHash(`${right.type}:${right.item.id}`, seed);
    if (leftHash !== rightHash) {
      return leftHash - rightHash;
    }
    return left.item.id.localeCompare(right.item.id);
  });
}

export function matchesMapAttributeFilters<TTaggedItem extends TaggedListingItem, TMapFilters>(
  item: TTaggedItem,
  filters: TMapFilters,
  accessors: TaggedListingAccessors<TTaggedItem, TMapFilters>,
): boolean {
  if (item.type !== 'map') return true;

  return (
    matchesSingleValueFilter(
      accessors.getMapLocation(item),
      accessors.getSelectedMapLocations(filters),
    ) &&
    matchesSingleValueFilter(
      accessors.getMapQuality(item, filters),
      accessors.getSelectedMapQuality(filters),
    ) &&
    matchesSingleValueFilter(
      accessors.getMapLevelOfDetail(item),
      accessors.getSelectedMapLevelOfDetail(filters),
    ) &&
    matchesZeroOrManyValuesFilter(
      accessors.getMapSpecialDemand(item),
      accessors.getSelectedMapSpecialDemand(filters),
    )
  );
}

export function filterAndSortTaggedItems<
  TTaggedItem extends TaggedListingItem,
  TMapFilters,
  TSortState = SortState,
>({
  items,
  filters,
  modDownloadTotals,
  mapDownloadTotals,
  compareItems,
  accessors,
  fuseOptions,
}: FilterAndSortTaggedItemsParams<TTaggedItem, TMapFilters, TSortState>): TTaggedItem[] {
  let result = items.filter((item) => item.type === filters.type);

  if (filters.mod.tags.length > 0) {
    result = result.filter((item) =>
      item.type === 'mod'
        ? matchesZeroOrManyValuesFilter(
            accessors.getModTags(item),
            filters.mod.tags,
          )
        : true,
    );
  }

  result = result.filter((item) =>
    matchesMapAttributeFilters(item, filters.map, accessors),
  );

  const query = filters.query.trim();
  if (query) {
    const searchable: SearchableItem<TTaggedItem>[] = result.map((entry) => ({
      entry,
      searchText: accessors.buildSearchText(entry),
    }));

    const fuse = new Fuse(
      searchable,
      fuseOptions ?? ASSET_LISTING_FUSE_SEARCH_OPTIONS,
    );
    result = fuse.search(query).map(({ item }) => item.entry);
  }

  if ((filters.sort as SortState).field === 'random') {
    return sortItemsBySeed(result, filters.randomSeed);
  }

  return [...result].sort((left, right) =>
    compareItems(
      left,
      right,
      filters.sort,
      modDownloadTotals,
      mapDownloadTotals,
    ),
  );
}

export function filterAndPaginateTaggedItems<
  TTaggedItem extends TaggedListingItem,
  TMapFilters,
  TSortState = SortState,
>({
  page,
  ...params
}: FilterAndPaginateTaggedItemsParams<
  TTaggedItem,
  TMapFilters,
  TSortState
>): FilteredPageResult<TTaggedItem> {
  const filtered = filterAndSortTaggedItems(params);
  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / params.filters.perPage));
  const boundedPage = Math.min(Math.max(1, page), totalPages);
  const start = (boundedPage - 1) * params.filters.perPage;

  return {
    filtered,
    items: filtered.slice(start, start + params.filters.perPage),
    page: boundedPage,
    totalPages,
    totalResults,
  };
}