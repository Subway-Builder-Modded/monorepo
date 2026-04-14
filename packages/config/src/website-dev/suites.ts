export type WebsiteDevSuiteId =
  | "general"
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
  breadcrumb: string[];
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
  lineMarker: {
    line: string;
    label: string;
  };
  items: WebsiteDevSuiteNavItem[];
};

export type WebsiteDevCommunityLink = {
  id: string;
  title: string;
  href: string;
  iconKey: WebsiteDevIconKey;
};

const GENERAL_ACCENT: WebsiteDevSuiteAccent = {
  light: "#0a0a0a",
  dark: "#ffffff",
  textInvertedLight: "#f2f2f2",
  textInvertedDark: "#232323",
};

export const WEBSITE_DEV_SUITES: WebsiteDevSuiteConfig[] = [
  {
    id: "general",
    title: "Subway Builder Modded",
    href: "/",
    iconKey: "logo",
    colorSchemeId: "default",
    accent: GENERAL_ACCENT,
    lineMarker: {
      line: "0",
      label: "Line 0",
    },
    items: [
      {
        id: "general-home",
        title: "Home",
        description:
          "Modernized suite gateway with signage-inspired navigation and design-system previews.",
        href: "/",
        iconKey: "overview",
        breadcrumb: ["Home"],
        activeMatchRules: [{ kind: "exact", path: "/" }],
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
    lineMarker: {
      line: "1",
      label: "Line 1",
    },
    items: [
      {
        id: "railyard-overview",
        title: "Overview",
        description:
          "Download flows, release rail, and project operations for the Railyard suite.",
        href: "/railyard",
        iconKey: "overview",
        breadcrumb: ["Overview"],
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
    },
    lineMarker: {
      line: "2",
      label: "Line 2",
    },
    items: [
      {
        id: "registry-overview",
        title: "Overview",
        description:
          "Analytics and metadata operations for the global Subway Builder Modded registry.",
        href: "/registry",
        iconKey: "overview",
        breadcrumb: ["Overview"],
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
    },
    lineMarker: {
      line: "3",
      label: "Line 3",
    },
    items: [
      {
        id: "template-mod-overview",
        title: "Overview",
        description:
          "Starter architecture and compatibility surface for rapid Subway Builder mod authoring.",
        href: "/template-mod",
        iconKey: "overview",
        breadcrumb: ["Overview"],
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
    },
    lineMarker: {
      line: "4",
      label: "Line 4",
    },
    items: [
      {
        id: "website-overview",
        title: "Overview",
        description:
          "Design-system governance, launch quality, and publishing operations for the website.",
        href: "/website",
        iconKey: "overview",
        breadcrumb: ["Overview"],
        activeMatchRules: [{ kind: "prefix", path: "/website" }],
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

const SUITE_BY_ID: Record<WebsiteDevSuiteId, WebsiteDevSuiteConfig> = {
  general: WEBSITE_DEV_SUITES[0],
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
    if (suite.id === "general") continue;
    if (normalized === suite.href || normalized.startsWith(`${suite.href}/`)) {
      return suite;
    }
  }

  return SUITE_BY_ID.general;
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
