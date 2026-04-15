export type SiteSuiteId =
  | "general"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website";

export type SiteColorSchemeId =
  | "default"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website";

export type SiteIconKey =
  | "logo"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website"
  | "overview"
  | "github"
  | "discord";

export type SiteRouteMatchRule = {
  kind: "exact" | "prefix";
  path: string;
};

export type SiteSuiteNavItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  iconKey: SiteIconKey;
  breadcrumb: string;
  activeMatchRules?: SiteRouteMatchRule[];
};

export type SiteSuiteAccent = {
  light: string;
  dark: string;
  textInvertedLight: string;
  textInvertedDark: string;
  /** Semi-transparent version of the accent, used for tinted hover/selected backgrounds. */
  mutedLight: string;
  mutedDark: string;
};

export type SiteSuiteConfig = {
  id: SiteSuiteId;
  title: string;
  href: string;
  iconKey: SiteIconKey;
  colorSchemeId: SiteColorSchemeId;
  accent: SiteSuiteAccent;
  breadcrumbFallback: string;
  items: SiteSuiteNavItem[];
};

export type SiteCommunityLink = {
  id: string;
  title: string;
  href: string;
  iconKey: SiteIconKey;
};

export type SiteFooterLinkGroup = {
  id: string;
  title: string;
  links: Array<{
    id: string;
    title: string;
    href: string;
  }>;
};

const GENERAL_ACCENT: SiteSuiteAccent = {
  light: "#0a0a0a",
  dark: "#ffffff",
  textInvertedLight: "#f2f2f2",
  textInvertedDark: "#232323",
  mutedLight: "rgba(10,10,10,0.07)",
  mutedDark: "rgba(255,255,255,0.09)",
};

export const SITE_SUITES: SiteSuiteConfig[] = [
  {
    id: "general",
    title: "Subway Builder Modded",
    href: "/",
    iconKey: "logo",
    colorSchemeId: "default",
    accent: GENERAL_ACCENT,
    breadcrumbFallback: "Home",
    items: [
      {
        id: "general-home",
        title: "Home",
        description: "Main entry for Subway Builder Modded.",
        href: "/",
        iconKey: "overview",
        breadcrumb: "Home",
        activeMatchRules: [{ kind: "exact", path: "/" }],
      },
      {
        id: "general-test",
        title: "Test",
        description: "Main entry for Subway Builder Modded. Main entry for Subway Builder Modded.",
        href: "/test",
        iconKey: "overview",
        breadcrumb: "Test",
        activeMatchRules: [{ kind: "exact", path: "/test" }],
      },
    ],
  },
  {
    id: "railyard",
    title: "Railyard",
    href: "/railyard",
    iconKey: "railyard",
    colorSchemeId: "railyard",
    accent: {
      light: "#0f8f68",
      dark: "#19d89c",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(15,143,104,0.11)",
      mutedDark: "rgba(25,216,156,0.13)",
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "railyard-overview",
        title: "Overview",
        description: "Release and distribution overview.",
        href: "/railyard",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/railyard" }],
      },
    ],
  },
  {
    id: "registry",
    title: "Registry",
    href: "/registry",
    iconKey: "registry",
    colorSchemeId: "registry",
    accent: {
      light: "#9d4edd",
      dark: "#c77dff",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(157,78,221,0.11)",
      mutedDark: "rgba(199,125,255,0.13)",
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "registry-overview",
        title: "Overview",
        description: "Registry index overview.",
        href: "/registry",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/registry" }],
      },
    ],
  },
  {
    id: "template-mod",
    title: "Template Mod",
    href: "/template-mod",
    iconKey: "template-mod",
    colorSchemeId: "template-mod",
    accent: {
      light: "#60a5fa",
      dark: "#93c5fd",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(96,165,250,0.11)",
      mutedDark: "rgba(147,197,253,0.13)",
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "template-mod-overview",
        title: "Overview",
        description: "Template module overview.",
        href: "/template-mod",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/template-mod" }],
      },
    ],
  },
  {
    id: "website",
    title: "Website",
    href: "/website",
    iconKey: "website",
    colorSchemeId: "website",
    accent: {
      light: "#f2992e",
      dark: "#ffbe73",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(242,153,46,0.11)",
      mutedDark: "rgba(255,190,115,0.13)",
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "website-overview",
        title: "Overview",
        description: "Website suite overview.",
        href: "/website",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/website" }],
      },
    ],
  },
];

export const SITE_COMMUNITY_LINKS: SiteCommunityLink[] = [
  {
    id: "github",
    title: "GitHub",
    href: "https://github.com/Subway-Builder-Modded",
    iconKey: "github",
  },
  {
    id: "discord",
    title: "Discord",
    href: "https://discord.gg/syG9YHMyeG",
    iconKey: "discord",
  },
];

export const SITE_FOOTER_INTERNAL_GROUP: SiteFooterLinkGroup = {
  id: "internal-suite-links",
  title: "Suites",
  links: SITE_SUITES.map((suite) => ({
    id: suite.id,
    title: suite.title,
    href: suite.href,
  })),
};

const SUITE_BY_ID: Record<SiteSuiteId, SiteSuiteConfig> = {
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

export function isSiteRouteMatch(pathname: string, rule: SiteRouteMatchRule): boolean {
  const normalized = normalizePathname(pathname);
  const normalizedRulePath = normalizePathname(rule.path);

  if (rule.kind === "exact") {
    return normalized === normalizedRulePath;
  }

  return normalized === normalizedRulePath || normalized.startsWith(`${normalizedRulePath}/`);
}

export function getSiteSuiteById(suiteId: SiteSuiteId): SiteSuiteConfig {
  return SUITE_BY_ID[suiteId];
}

export function resolveSiteSuite(pathname: string): SiteSuiteConfig {
  const normalized = normalizePathname(pathname);

  for (const suite of SITE_SUITES) {
    if (suite.id === "general") continue;
    if (normalized === suite.href || normalized.startsWith(`${suite.href}/`)) {
      return suite;
    }
  }

  return SUITE_BY_ID.general;
}

export function resolveSiteSuiteItem(pathname: string, suiteId?: SiteSuiteId): SiteSuiteNavItem {
  const suite = suiteId ? getSiteSuiteById(suiteId) : resolveSiteSuite(pathname);

  for (const item of suite.items) {
    if (!item.activeMatchRules?.length) {
      if (normalizePathname(pathname) === item.href) {
        return item;
      }
      continue;
    }

    if (item.activeMatchRules.some((rule) => isSiteRouteMatch(pathname, rule))) {
      return item;
    }
  }

  return suite.items[0];
}

export function getSiteBreadcrumbLabel(pathname: string, suiteId?: SiteSuiteId): string {
  const suite = suiteId ? getSiteSuiteById(suiteId) : resolveSiteSuite(pathname);
  return resolveSiteSuiteItem(pathname, suite.id)?.breadcrumb ?? suite.breadcrumbFallback;
}

/**
 * Returns the nav item that actually matches the current pathname for the given suite,
 * or null if no item matches. Unlike resolveSiteSuiteItem, does NOT fall back to items[0].
 * Use this for active-state highlighting only.
 */
export function getMatchingSiteSuiteItem(
  pathname: string,
  suiteId: SiteSuiteId,
): SiteSuiteNavItem | null {
  const suite = getSiteSuiteById(suiteId);

  for (const item of suite.items) {
    if (!item.activeMatchRules?.length) {
      if (normalizePathname(pathname) === normalizePathname(item.href)) {
        return item;
      }
      continue;
    }

    if (item.activeMatchRules.some((rule) => isSiteRouteMatch(pathname, rule))) {
      return item;
    }
  }

  return null;
}
