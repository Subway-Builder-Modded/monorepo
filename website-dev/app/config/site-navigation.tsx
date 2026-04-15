import type { ComponentType, ReactNode } from "react";
import {
  Database,
  Github,
  Globe,
  House,
  LayoutGrid,
  TrainTrack,
  Handshake,
  Users,
  Heart,
  Scale,
  ChartLine,
} from "lucide-react";
import { FaDiscord as Discord } from "react-icons/fa6";

export type SiteSuiteId = "general" | "railyard" | "registry" | "template-mod" | "website";

export type SiteColorSchemeId = "default" | "railyard" | "registry" | "template-mod" | "website";

export type SiteRouteMatchRule = {
  kind: "exact" | "prefix";
  path: string;
};

export type SiteSuiteAccent = {
  light: string;
  dark: string;
  textInvertedLight: string;
  textInvertedDark: string;
  mutedLight: string;
  mutedDark: string;
};

export type SiteSuite = {
  id: SiteSuiteId;
  title: string;
  href: string;
  icon: ReactNode;
  colorSchemeId: SiteColorSchemeId;
  accent: SiteSuiteAccent;
  breadcrumbFallback: string;
};

export type SiteNavItem = {
  id: string;
  suiteId: SiteSuiteId;
  title: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  breadcrumb: string;
  description?: string;
  activeMatchRules?: SiteRouteMatchRule[];
};

export type SiteCommunityLink = {
  id: "github" | "discord";
  title: string;
  href: string;
  icon: ReactNode;
};

const SUITE_ICON_CLASS = "size-4";
const EXTERNAL_ICON_CLASS = "size-4";

const GENERAL_ACCENT: SiteSuiteAccent = {
  light: "#0a0a0a",
  dark: "#ffffff",
  textInvertedLight: "#f2f2f2",
  textInvertedDark: "#232323",
  mutedLight: "rgba(10,10,10,0.07)",
  mutedDark: "rgba(255,255,255,0.09)",
};

export const SITE_SUITES: SiteSuite[] = [
  {
    id: "general",
    title: "Subway Builder Modded",
    href: "/",
    icon: <img src="/logo.png" alt="" aria-hidden="true" className="size-4 object-contain" />,
    colorSchemeId: "default",
    accent: GENERAL_ACCENT,
    breadcrumbFallback: "Home",
  },
  {
    id: "railyard",
    title: "Railyard",
    href: "/railyard",
    icon: <TrainTrack className={SUITE_ICON_CLASS} aria-hidden="true" />,
    colorSchemeId: "railyard",
    accent: {
      light: "#0f8f68",
      dark: "#19d89c",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(15,143,104,0.11)",
      mutedDark: "rgba(25,216,156,0.13)",
    },
    breadcrumbFallback: "Railyard",
  },
  {
    id: "registry",
    title: "Registry",
    href: "/registry",
    icon: <Database className={SUITE_ICON_CLASS} aria-hidden="true" />,
    colorSchemeId: "registry",
    accent: {
      light: "#9d4edd",
      dark: "#c77dff",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(157,78,221,0.11)",
      mutedDark: "rgba(199,125,255,0.13)",
    },
    breadcrumbFallback: "Registry",
  },
  {
    id: "template-mod",
    title: "Template Mod",
    href: "/template-mod",
    icon: <LayoutGrid className={SUITE_ICON_CLASS} aria-hidden="true" />,
    colorSchemeId: "template-mod",
    accent: {
      light: "#60a5fa",
      dark: "#93c5fd",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(96,165,250,0.11)",
      mutedDark: "rgba(147,197,253,0.13)",
    },
    breadcrumbFallback: "Template Mod",
  },
  {
    id: "website",
    title: "Website",
    href: "/website",
    icon: <Globe className={SUITE_ICON_CLASS} aria-hidden="true" />,
    colorSchemeId: "website",
    accent: {
      light: "#f2992e",
      dark: "#ffbe73",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(242,153,46,0.11)",
      mutedDark: "rgba(255,190,115,0.13)",
    },
    breadcrumbFallback: "Website",
  },
];

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  {
    id: "general-home",
    suiteId: "general",
    title: "Home",
    description:
      "Welcome to Subway Builder Modded, the complete hub for all things modded in Subway Builder.",
    href: "/",
    icon: House,
    breadcrumb: "Home",
    activeMatchRules: [{ kind: "exact", path: "/" }],
  },
  {
    id: "general-community",
    suiteId: "general",
    title: "Community",
    description:
      "Join our Discord community for support, discussions, and the most up-to-date info.",
    href: "/community",
    icon: Handshake,
    breadcrumb: "Community",
    activeMatchRules: [{ kind: "exact", path: "/community" }],
  },
  {
    id: "general-credits",
    suiteId: "general",
    title: "Credits",
    description: "The maintainers and contributors helping Subway Builder Modded move forward.",
    href: "/credits",
    icon: Users,
    breadcrumb: "Credits",
    activeMatchRules: [{ kind: "exact", path: "/credits" }],
  },
  {
    id: "general-contribute",
    suiteId: "general",
    title: "Contribute",
    description:
      "Help us build the future of Subway Builder Modded. Your support keeps the project going.",
    href: "/contribute",
    icon: Heart,
    breadcrumb: "Contribute",
    activeMatchRules: [{ kind: "exact", path: "/contribute" }],
  },
  {
    id: "general-license",
    suiteId: "general",
    title: "License",
    description: "Terms and licensing information for Subway Builder Modded projects.",
    href: "/license",
    icon: Scale,
    breadcrumb: "License",
    activeMatchRules: [{ kind: "exact", path: "/license" }],
  },
  {
    id: "railyard-download",
    suiteId: "railyard",
    title: "Home",
    description: "The all-in-one Map and Mod Manager for Subway Builder.",
    href: "/railyard",
    icon: House,
    breadcrumb: "Home",
    activeMatchRules: [{ kind: "exact", path: "/railyard" }],
  },
  {
    id: "railyard-analytics",
    suiteId: "railyard",
    title: "Analytics",
    description: "In-depth release and download analytics for the Railyard desktop app.",
    href: "/railyard/analytics",
    icon: ChartLine,
    breadcrumb: "Analytics",
    activeMatchRules: [{ kind: "exact", path: "/railyard/analytics" }],
  },
];

export const SITE_COMMUNITY_LINKS: SiteCommunityLink[] = [
  {
    id: "discord",
    title: "Discord",
    href: "https://discord.gg/syG9YHMyeG",
    icon: <Discord className={EXTERNAL_ICON_CLASS} aria-hidden="true" />,
  },
  {
    id: "github",
    title: "GitHub",
    href: "https://github.com/Subway-Builder-Modded",
    icon: <Github className={EXTERNAL_ICON_CLASS} aria-hidden="true" />,
  },
];

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

    const suiteHref = normalizePathname(suite.href);
    if (normalizedPathname === suiteHref || normalizedPathname.startsWith(`${suiteHref}/`)) {
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
  return getMatchingItem(pathname, getActiveSuite(pathname).id);
}

export function getBreadcrumbLabel(pathname: string): string {
  const activeItem = getActiveItem(pathname);
  if (activeItem) {
    return activeItem.breadcrumb;
  }

  return getActiveSuite(pathname).breadcrumbFallback;
}
