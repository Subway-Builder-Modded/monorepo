import {
  WEBSITE_DEV_COMMUNITY_LINKS,
  WEBSITE_DEV_SUITES,
  getWebsiteDevSuiteById,
  resolveWebsiteDevSuite,
  resolveWebsiteDevSuiteItem,
  type WebsiteDevSuiteConfig,
  type WebsiteDevSuiteId,
  type WebsiteDevSuiteNavItem,
} from "@subway-builder-modded/config";

export { WEBSITE_DEV_COMMUNITY_LINKS, WEBSITE_DEV_SUITES };

export type SiteSuite = WebsiteDevSuiteConfig;
export type SiteSuiteId = WebsiteDevSuiteId;
export type SiteSuiteNavItem = WebsiteDevSuiteNavItem;

export function getSuiteById(id: SiteSuiteId): SiteSuite {
  return getWebsiteDevSuiteById(id);
}

export function getActiveSuite(pathname: string): SiteSuite {
  return resolveWebsiteDevSuite(pathname);
}

export function getActiveSuiteItem(pathname: string, suiteId?: SiteSuiteId): SiteSuiteNavItem {
  return resolveWebsiteDevSuiteItem(pathname, suiteId);
}

export function getBreadcrumbLabel(item: SiteSuiteNavItem): string {
  return item.breadcrumb.join(" / ");
}
