export const WORKSPACE_NAME = 'subway-builder-modded' as const;
export const WORKSPACE_VERSION = '0.0.0' as const;

export type {
	ActiveRouteMatchRule,
	NavIconKey,
	SharedNavAction,
	SharedNavBrand,
	SharedNavItem,
	SharedNavSection,
	SharedNavbarModel,
} from './navbar/types';
export {
	RAILYARD_SHARED_NAVBAR_MODEL,
	WEBSITE_SHARED_NAVBAR_MODEL,
} from './navbar/content';
export { isNavItemActive, isRouteMatch } from './navbar/route-match';
export {
	isSearchViewMode,
	normalizeSearchViewMode,
	type SearchViewMode,
} from './asset-listings/search-view-mode';
export {
	MAX_CARD_BADGES,
	SEARCH_BAR_PLACEHOLDER,
	SEARCH_FILTER_EMPTY_LABELS,
} from './asset-listings/search-constants';
export {
	ASSET_LISTING_PATHS,
	ASSET_TYPE_TO_LISTING_PATH,
	ASSET_TYPES,
	assetTypeToListingPath,
	listingPathToAssetType,
	type AssetListingPath,
	type AssetType,
} from './asset-listings/asset-types';