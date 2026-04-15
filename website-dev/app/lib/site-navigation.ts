import {
  getSiteBreadcrumbLabel,
  SITE_COMMUNITY_LINKS,
  SITE_FOOTER_INTERNAL_GROUP,
  SITE_SUITES,
  getSiteSuiteById,
  resolveSiteSuite,
  resolveSiteSuiteItem,
  getMatchingSiteSuiteItem,
  type SiteSuiteConfig as ConfigSiteSuite,
  type SiteSuiteId as ConfigSiteSuiteId,
  type SiteSuiteNavItem as ConfigSiteSuiteNavItem,
} from "@subway-builder-modded/config";

export { SITE_COMMUNITY_LINKS, SITE_FOOTER_INTERNAL_GROUP, SITE_SUITES };

export type SiteSuite = ConfigSiteSuite;
export type SiteSuiteId = ConfigSiteSuiteId;
export type SiteSuiteNavItem = ConfigSiteSuiteNavItem;

export function getSuiteById(id: SiteSuiteId): SiteSuite {
  return getSiteSuiteById(id);
}

export function getActiveSuite(pathname: string): SiteSuite {
  return resolveSiteSuite(pathname);
}

export function getActiveSuiteItem(pathname: string, suiteId?: SiteSuiteId): SiteSuiteNavItem {
  return resolveSiteSuiteItem(pathname, suiteId);
}

export function getBreadcrumbLabel(pathname: string, suiteId?: SiteSuiteId): string {
  return getSiteBreadcrumbLabel(pathname, suiteId);
}

/**
 * Returns the nav item that actually matches the current pathname, or null.
 * Unlike getActiveSuiteItem, does NOT fall back to items[0].
 * Use for active-state highlighting only.
 */
export function getMatchingNavItem(
  pathname: string,
  suiteId: SiteSuiteId,
): SiteSuiteNavItem | null {
  return getMatchingSiteSuiteItem(pathname, suiteId);
}
