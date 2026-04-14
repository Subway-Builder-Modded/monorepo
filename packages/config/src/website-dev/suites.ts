export type WebsiteDevSuiteId =
  | "subway-builder-modded"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website";

export type WebsiteDevColorSchemeId =
  | "default"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website";

export type WebsiteDevIconKey =
  | "logo"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website"
  | "overview"
  | "browse"
  | "directory"
  | "blueprint"
  | "metrics"
  | "github"
  | "discord";

export type WebsiteDevRouteMatchRule = {
  kind: "exact" | "prefix";
  path: string;
};

export type WebsiteDevSuiteNavItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  iconKey: WebsiteDevIconKey;
  breadcrumb: string;
  activeMatchRules?: WebsiteDevRouteMatchRule[];
};

export type WebsiteDevSuiteAccent = {
  light: string;
  dark: string;
  textInvertedLight: string;
  textInvertedDark: string;
};

export type WebsiteDevSuiteConfig = {
  id: WebsiteDevSuiteId;
  title: string;
  href: string;
  iconKey: WebsiteDevIconKey;
  colorSchemeId: WebsiteDevColorSchemeId;
  accent: WebsiteDevSuiteAccent;
  breadcrumbFallback: string;
  items: WebsiteDevSuiteNavItem[];
};

export type WebsiteDevCommunityLink = {
  id: string;
  title: string;
  href: string;
  iconKey: WebsiteDevIconKey;
};

export type WebsiteDevFooterLinkGroup = {
  id: string;
  title: string;
  links: Array<{
    id: string;
    title: string;
    href: string;
  }>;
};

const GENERAL_ACCENT: WebsiteDevSuiteAccent = {
  light: "#0a0a0a",
  dark: "#ffffff",
  textInvertedLight: "#f2f2f2",
  textInvertedDark: "#232323",
};

export const WEBSITE_DEV_SUITES: WebsiteDevSuiteConfig[] = [
  {
    id: "subway-builder-modded",
    title: "Subway Builder Modded",
    href: "/",
    iconKey: "logo",
    colorSchemeId: "default",
    accent: GENERAL_ACCENT,
    breadcrumbFallback: "Home",
    items: [
      {
        id: "home",
        title: "Home",
        description: "Main gateway for the Subway Builder Modded ecosystem.",
        href: "/",
        iconKey: "overview",
        breadcrumb: "Home",
        activeMatchRules: [{ kind: "exact", path: "/" }],
      },
      {
        id: "go-railyard",
        title: "Railyard",
        description: "Downloads, release updates, and distribution channels.",
        href: "/railyard",
        iconKey: "railyard",
        breadcrumb: "Browse",
      },
      {
        id: "go-registry",
        title: "Registry",
        description: "Discover packages and ecosystem metadata.",
        href: "/registry",
        iconKey: "directory",
        breadcrumb: "Directory",
      },
      {
        id: "go-template-mod",
        title: "Template Mod",
        description: "Start projects with production-ready templates.",
        href: "/template-mod",
        iconKey: "blueprint",
        breadcrumb: "Start",
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
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "railyard-overview",
        title: "Overview",
        description: "Suite landing with release and operations entry points.",
        href: "/railyard",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/railyard" }],
      },
      {
        id: "railyard-browse",
        title: "Browse",
        description: "Inspect active channels and currently tracked modules.",
        href: "/railyard",
        iconKey: "browse",
        breadcrumb: "Browse",
      },
      {
        id: "railyard-registry",
        title: "Registry",
        description: "Jump to package metadata and index coverage.",
        href: "/registry",
        iconKey: "registry",
        breadcrumb: "Directory",
      },
      {
        id: "railyard-template-mod",
        title: "Template Mod",
        description: "Open template assets and starter scaffolds.",
        href: "/template-mod",
        iconKey: "template-mod",
        breadcrumb: "Templates",
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
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "registry-overview",
        title: "Overview",
        description: "Core index context for the Registry suite.",
        href: "/registry",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/registry" }],
      },
      {
        id: "registry-browse",
        title: "Browse",
        description: "Scan categories and package records quickly.",
        href: "/registry",
        iconKey: "browse",
        breadcrumb: "Browse",
      },
      {
        id: "registry-railyard",
        title: "Railyard",
        description: "See release channels and package delivery state.",
        href: "/railyard",
        iconKey: "railyard",
        breadcrumb: "Releases",
      },
      {
        id: "registry-website",
        title: "Website",
        description: "Open platform-level pages and metrics context.",
        href: "/website",
        iconKey: "website",
        breadcrumb: "Metrics",
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
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "template-mod-overview",
        title: "Overview",
        description: "Primary launch point for template module workflows.",
        href: "/template-mod",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/template-mod" }],
      },
      {
        id: "template-mod-blueprints",
        title: "Blueprints",
        description: "Reusable structure and starter package guidance.",
        href: "/template-mod",
        iconKey: "blueprint",
        breadcrumb: "Blueprints",
      },
      {
        id: "template-mod-registry",
        title: "Registry",
        description: "Locate published packages and compatibility ranges.",
        href: "/registry",
        iconKey: "registry",
        breadcrumb: "Directory",
      },
      {
        id: "template-mod-railyard",
        title: "Railyard",
        description: "Check release rails and distribution updates.",
        href: "/railyard",
        iconKey: "railyard",
        breadcrumb: "Releases",
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
    },
    breadcrumbFallback: "Overview",
    items: [
      {
        id: "website-overview",
        title: "Overview",
        description: "Top-level website suite context and navigation.",
        href: "/website",
        iconKey: "overview",
        breadcrumb: "Overview",
        activeMatchRules: [{ kind: "prefix", path: "/website" }],
      },
      {
        id: "website-metrics",
        title: "Metrics",
        description: "Track platform health and visibility signals.",
        href: "/website",
        iconKey: "metrics",
        breadcrumb: "Metrics",
      },
      {
        id: "website-railyard",
        title: "Railyard",
        description: "Open release and delivery context for ecosystem apps.",
        href: "/railyard",
        iconKey: "railyard",
        breadcrumb: "Releases",
      },
      {
        id: "website-registry",
        title: "Registry",
        description: "Navigate to indexed package records and metadata.",
        href: "/registry",
        iconKey: "registry",
        breadcrumb: "Directory",
      },
    ],
  },
];

export const WEBSITE_DEV_COMMUNITY_LINKS: WebsiteDevCommunityLink[] = [
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

export const WEBSITE_DEV_FOOTER_SUITE_GROUP: WebsiteDevFooterLinkGroup = {
  id: "suite-navigation",
  title: "Suites",
  links: WEBSITE_DEV_SUITES.map((suite) => ({
    id: suite.id,
    title: suite.title,
    href: suite.href,
  })),
};

export const WEBSITE_DEV_FOOTER_INTERNAL_GROUP: WebsiteDevFooterLinkGroup = {
  id: "internal-suite-links",
  title: "Internal",
  links: [
    { id: "home", title: "Home", href: "/" },
    { id: "railyard", title: "Railyard", href: "/railyard" },
    { id: "registry", title: "Registry", href: "/registry" },
    { id: "template-mod", title: "Template Mod", href: "/template-mod" },
    { id: "website", title: "Website", href: "/website" },
  ],
};

const SUITE_BY_ID: Record<WebsiteDevSuiteId, WebsiteDevSuiteConfig> = {
  "subway-builder-modded": WEBSITE_DEV_SUITES[0],
  railyard: WEBSITE_DEV_SUITES[1],
  registry: WEBSITE_DEV_SUITES[2],
  "template-mod": WEBSITE_DEV_SUITES[3],
  website: WEBSITE_DEV_SUITES[4],
};

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

export function isWebsiteDevRouteMatch(
  pathname: string,
  rule: WebsiteDevRouteMatchRule,
): boolean {
  const normalized = normalizePathname(pathname);
  const normalizedRulePath = normalizePathname(rule.path);

  if (rule.kind === "exact") {
    return normalized === normalizedRulePath;
  }

  return (
    normalized === normalizedRulePath ||
    normalized.startsWith(`${normalizedRulePath}/`)
  );
}

export function getWebsiteDevSuiteById(
  suiteId: WebsiteDevSuiteId,
): WebsiteDevSuiteConfig {
  return SUITE_BY_ID[suiteId];
}

export function resolveWebsiteDevSuite(pathname: string): WebsiteDevSuiteConfig {
  const normalized = normalizePathname(pathname);

  for (const suite of WEBSITE_DEV_SUITES) {
    if (suite.id === "subway-builder-modded") continue;
    if (normalized === suite.href || normalized.startsWith(`${suite.href}/`)) {
      return suite;
    }
  }

  return SUITE_BY_ID["subway-builder-modded"];
}

export function resolveWebsiteDevSuiteItem(
  pathname: string,
  suiteId?: WebsiteDevSuiteId,
): WebsiteDevSuiteNavItem {
  const suite = suiteId
    ? getWebsiteDevSuiteById(suiteId)
    : resolveWebsiteDevSuite(pathname);

  for (const item of suite.items) {
    if (!item.activeMatchRules?.length) {
      if (normalizePathname(pathname) === item.href) {
        return item;
      }
      continue;
    }

    const isActive = item.activeMatchRules.some((rule) =>
      isWebsiteDevRouteMatch(pathname, rule),
    );

    if (isActive) {
      return item;
    }
  }

  return suite.items[0];
}

export function getWebsiteDevBreadcrumbLabel(
  pathname: string,
  suiteId?: WebsiteDevSuiteId,
): string {
  const suite = suiteId
    ? getWebsiteDevSuiteById(suiteId)
    : resolveWebsiteDevSuite(pathname);

  return resolveWebsiteDevSuiteItem(pathname, suite.id)?.breadcrumb ?? suite.breadcrumbFallback;
}
