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
