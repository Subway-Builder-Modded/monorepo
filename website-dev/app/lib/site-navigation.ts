import {
  SITE_COMMUNITY_LINKS,
  SITE_NAV_ITEMS,
  SITE_SUITES,
  type SiteNavItem,
  type SiteRouteMatchRule,
  type SiteSuite,
  type SiteSuiteId,
} from "@/app/config/site-navigation";

export {
  SITE_COMMUNITY_LINKS,
  SITE_NAV_ITEMS,
  SITE_SUITES,
  type SiteNavItem,
  type SiteRouteMatchRule,
  type SiteSuite,
  type SiteSuiteId,
};

const SUITE_BY_ID: Record<SiteSuiteId, SiteSuite> = {
  general: SITE_SUITES[0],
  railyard: SITE_SUITES[1],
  registry: SITE_SUITES[2],
  "template-mod": SITE_SUITES[3],
  website: SITE_SUITES[4],
};

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

function isRouteMatch(pathname: string, rule: SiteRouteMatchRule): boolean {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedRulePath = normalizePathname(rule.path);

  if (rule.kind === "exact") {
    return normalizedPathname === normalizedRulePath;
  }

  return (
    normalizedPathname === normalizedRulePath ||
    normalizedPathname.startsWith(`${normalizedRulePath}/`)
  );
}

export function getSuiteById(id: SiteSuiteId): SiteSuite {
  return SUITE_BY_ID[id];
}

export function getItemsForSuite(suiteId: SiteSuiteId): SiteNavItem[] {
  return SITE_NAV_ITEMS.filter((item) => item.suiteId === suiteId);
}

export function getActiveSuite(pathname: string): SiteSuite {
  const normalizedPathname = normalizePathname(pathname);

  for (const suite of SITE_SUITES) {
    if (suite.id === "general") {
      continue;
    }

    if (
      normalizedPathname === normalizePathname(suite.href) ||
      normalizedPathname.startsWith(`${normalizePathname(suite.href)}/`)
    ) {
      return suite;
    }
  }

  return SUITE_BY_ID.general;
}

export function getMatchingItem(pathname: string, suiteId: SiteSuiteId): SiteNavItem | null {
  const items = getItemsForSuite(suiteId);
  const normalizedPathname = normalizePathname(pathname);

  for (const item of items) {
    if (!item.activeMatchRules?.length) {
      if (normalizedPathname === normalizePathname(item.href)) {
        return item;
      }
      continue;
    }

    if (item.activeMatchRules.some((rule) => isRouteMatch(pathname, rule))) {
      return item;
    }
  }

  return null;
}

export function getActiveItem(pathname: string): SiteNavItem | null {
  const activeSuite = getActiveSuite(pathname);
  return getMatchingItem(pathname, activeSuite.id);
}

export function getBreadcrumbLabel(pathname: string): string {
  const activeItem = getActiveItem(pathname);
  if (activeItem) {
    return activeItem.breadcrumb;
  }

  return getActiveSuite(pathname).breadcrumbFallback;
}
