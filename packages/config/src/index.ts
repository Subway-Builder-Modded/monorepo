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