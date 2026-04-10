export const ASSET_TYPES = ['mod', 'map'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_LISTING_PATHS = ['mods', 'maps'] as const;
export type AssetListingPath = (typeof ASSET_LISTING_PATHS)[number];

export const ASSET_TYPE_TO_LISTING_PATH: Record<AssetType, AssetListingPath> = {
  map: 'maps',
  mod: 'mods',
};

export function assetTypeToListingPath(assetType: AssetType): AssetListingPath {
  return ASSET_TYPE_TO_LISTING_PATH[assetType];
}

export function listingPathToAssetType(path: string): AssetType | undefined {
  if (path === 'maps') return 'map';
  if (path === 'mods') return 'mod';
  return undefined;
}

export const SEARCH_VIEW_MODES = ['full', 'compact', 'list'] as const;
export type SearchViewMode = (typeof SEARCH_VIEW_MODES)[number];

export function isSearchViewMode(value: unknown): value is SearchViewMode {
  return (
    typeof value === 'string' &&
    (SEARCH_VIEW_MODES as readonly string[]).includes(value)
  );
}

export function normalizeSearchViewMode(
  value: unknown,
  fallback: SearchViewMode = 'full',
): SearchViewMode {
  return isSearchViewMode(value) ? value : fallback;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface SortFieldOption {
  field: string;
  label: string;
}

export type GalleryAssetType = AssetType;

export const LOCATION_TAGS = [
  'caribbean',
  'central-america',
  'central-asia',
  'east-africa',
  'east-asia',
  'europe',
  'middle-east',
  'north-africa',
  'north-america',
  'oceania',
  'south-america',
  'south-asia',
  'southeast-asia',
  'southern-africa',
  'west-africa',
] as const;

export const SOURCE_QUALITY_VALUES = [
  'low-quality',
  'medium-quality',
  'high-quality',
] as const;

const SOURCE_QUALITY_LABELS: Record<string, string> = {
  'low-quality': 'low-data-quality',
  'medium-quality': 'medium-data-quality',
  'high-quality': 'high-data-quality',
};

export function formatSourceQuality(value: string): string {
  return SOURCE_QUALITY_LABELS[value] ?? value;
}

export const LEVEL_OF_DETAIL_VALUES = [
  'low-detail',
  'medium-detail',
  'high-detail',
] as const;

export function buildSpecialDemandValues(
  maps: ReadonlyArray<{ special_demand?: string[] | null }>,
): string[] {
  return [...new Set(maps.flatMap((map) => map.special_demand ?? []))].sort();
}
