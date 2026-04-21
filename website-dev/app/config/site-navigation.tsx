import type { ComponentType, ReactNode } from "react";
import {
  Database,
  Anvil,
  Globe,
  House,
  LayoutGrid,
  TrainTrack,
  Handshake,
  Users,
  Heart,
  Scale,
  ChartLine,
  Compass,
  BookText,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { FaDiscord as Discord } from "react-icons/fa6";
import { GithubIcon } from "@subway-builder-modded/shared-ui";

function MarkdownIcon({ className }: { className?: string; "aria-hidden"?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={className ?? "size-5"}
      style={{
        backgroundColor: "currentColor",
        display: "inline-block",
        maskImage: "url('/assets/markdown.svg')",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: "url('/assets/markdown.svg')",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

export type SiteSuiteId =
  | "general"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website"
  | "foundry";

export type SiteColorSchemeId =
  | "default"
  | "railyard"
  | "registry"
  | "template-mod"
  | "website"
  | "foundry";

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
  icon: SiteIcon;
  colorSchemeId: SiteColorSchemeId;
  accent: SiteSuiteAccent;
};

export type SiteIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export type SiteNavItem = {
  id: string;
  suiteId: SiteSuiteId;
  title: string;
  href: string;
  icon: SiteIcon;
  description?: string;
  activeMatchRules?: SiteRouteMatchRule[];
};

export type SiteCommunityLink = {
  id: "github" | "discord";
  title: string;
  href: string;
  icon: ReactNode;
};

const EXTERNAL_ICON_CLASS = "size-4";

const GENERAL_ACCENT: SiteSuiteAccent = {
  light: "#0a0a0a",
  dark: "#ffffff",
  textInvertedLight: "#f2f2f2",
  textInvertedDark: "#232323",
  mutedLight: "rgba(10,10,10,0.14)",
  mutedDark: "rgba(255,255,255,0.09)",
};

export const SITE_SUITES: SiteSuite[] = [
  {
    id: "general",
    title: "General",
    href: "/",
    icon: Compass,
    colorSchemeId: "default",
    accent: GENERAL_ACCENT,
  },
  {
    id: "railyard",
    title: "Railyard",
    href: "/railyard",
    icon: TrainTrack,
    colorSchemeId: "railyard",
    accent: {
      light: "#0f8f68",
      dark: "#19d89c",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(15,143,104,0.18)",
      mutedDark: "rgba(25,216,156,0.13)",
    },
  },
  {
    id: "registry",
    title: "Registry",
    href: "/registry",
    icon: Database,
    colorSchemeId: "registry",
    accent: {
      light: "#9d4edd",
      dark: "#c77dff",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(157,78,221,0.18)",
      mutedDark: "rgba(199,125,255,0.13)",
    },
  },
  {
    id: "template-mod",
    title: "Template Mod",
    href: "/template-mod",
    icon: LayoutGrid,
    colorSchemeId: "template-mod",
    accent: {
      light: "#60a5fa",
      dark: "#93c5fd",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(96,165,250,0.18)",
      mutedDark: "rgba(147,197,253,0.13)",
    },
  },
  {
    id: "website",
    title: "Website",
    href: "/website",
    icon: Globe,
    colorSchemeId: "website",
    accent: {
      light: "#f2992e",
      dark: "#ffbe73",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(242,153,46,0.18)",
      mutedDark: "rgba(255,190,115,0.13)",
    },
  },
  {
    id: "foundry",
    title: "Foundry",
    href: "/foundry",
    icon: Anvil,
    colorSchemeId: "foundry",
    accent: {
      light: "#d64545",
      dark: "#ff6b6b",
      textInvertedLight: "#f2f2f2",
      textInvertedDark: "#232323",
      mutedLight: "rgba(214,69,69,0.18)",
      mutedDark: "rgba(255,107,107,0.13)",
    },
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
    activeMatchRules: [{ kind: "exact", path: "/community" }],
  },
  {
    id: "general-credits",
    suiteId: "general",
    title: "Credits",
    description: "The maintainers and contributors helping Subway Builder Modded move forward.",
    href: "/credits",
    icon: Users,
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
    activeMatchRules: [{ kind: "exact", path: "/contribute" }],
  },
  {
    id: "general-license",
    suiteId: "general",
    title: "License",
    description: "Terms and licensing information for Subway Builder Modded projects.",
    href: "/license",
    icon: Scale,
    activeMatchRules: [{ kind: "exact", path: "/license" }],
  },
  {
    id: "railyard-home",
    suiteId: "railyard",
    title: "Home",
    description:
      "Discover and download the all-in-one manager for Subway Builder community-made content.",
    href: "/railyard",
    icon: House,
    activeMatchRules: [{ kind: "exact", path: "/railyard" }],
  },
  {
    id: "railyard-browse",
    suiteId: "railyard",
    title: "Browse",
    description: "Browse our registry of community-made content for Subway Builder.",
    href: "/railyard/browse",
    icon: Compass,
    activeMatchRules: [{ kind: "prefix", path: "/railyard/browse" }],
  },
  {
    id: "railyard-docs",
    suiteId: "railyard",
    title: "Docs",
    description: "The official documentation for the Railyard app.",
    href: "/railyard/docs",
    icon: BookText,
    activeMatchRules: [{ kind: "prefix", path: "/railyard/docs" }],
  },
  {
    id: "railyard-updates",
    suiteId: "railyard",
    title: "Updates",
    description: "View the changelogs and release notes for Railyard.",
    href: "/railyard/updates",
    icon: Megaphone,
    activeMatchRules: [{ kind: "prefix", path: "/railyard/updates" }],
  },
  {
    id: "railyard-analytics",
    suiteId: "railyard",
    title: "Analytics",
    description: "In-depth release and download analytics for the Railyard app.",
    href: "/railyard/analytics",
    icon: ChartLine,
    activeMatchRules: [{ kind: "exact", path: "/railyard/analytics" }],
  },
  {
    id: "registry-docs",
    suiteId: "registry",
    title: "Docs",
    description: "The official documentation for the Registry powering Subway Builder Modded.",
    href: "/registry/docs",
    icon: BookText,
    activeMatchRules: [{ kind: "prefix", path: "/registry/docs" }],
  },
  {
    id: "registry-analytics",
    suiteId: "registry",
    title: "Analytics",
    description: "View in-depth analytics and insights for Registry-hosted content.",
    href: "/registry/analytics",
    icon: ChartLine,
    activeMatchRules: [{ kind: "exact", path: "/registry/analytics" }],
  },
  {
    id: "registry-trending",
    suiteId: "registry",
    title: "Trending",
    description: "View the most trending content in the Registry based on recent activity.",
    href: "/registry/trending",
    icon: TrendingUp,
    activeMatchRules: [{ kind: "exact", path: "/registry/trending" }],
  },
  {
    id: "registry-world-map",
    suiteId: "registry",
    title: "World Map",
    description: "Interactively explore all of the user-submitted maps available in the Registry.",
    href: "/registry/world-map",
    icon: Globe,
    activeMatchRules: [{ kind: "exact", path: "/registry/world-map" }],
  },
  {
    id: "registry-markdown-playground",
    suiteId: "registry",
    title: "Playground",
    description: "Experiment with Markdown content in a live preview environment.",
    href: "/registry/markdown-playground",
    icon: MarkdownIcon,
    activeMatchRules: [{ kind: "exact", path: "/registry/markdown-playground" }],
  },
  {
    id: "template-mod-home",
    suiteId: "template-mod",
    title: "Home",
    description: "Discover the all-inclusive TypeScript template for creating Subway Builder mods.",
    href: "/template-mod",
    icon: House,
    activeMatchRules: [{ kind: "exact", path: "/template-mod" }],
  },
  {
    id: "template-mod-docs",
    suiteId: "template-mod",
    title: "Docs",
    description: "The official documentation for the Subway Builder Modded Template Mod.",
    href: "/template-mod/docs",
    icon: BookText,
    activeMatchRules: [{ kind: "prefix", path: "/template-mod/docs" }],
  },
  {
    id: "template-mod-updates",
    suiteId: "template-mod",
    title: "Updates",
    description: "View the changelogs and release notes for the Template Mod.",
    href: "/template-mod/updates",
    icon: Megaphone,
    activeMatchRules: [{ kind: "prefix", path: "/template-mod/updates" }],
  },
  {
    id: "website-updates",
    suiteId: "website",
    title: "Updates",
    description: "View the changelogs and release notes for the Website.",
    href: "/website/updates",
    icon: Megaphone,
    activeMatchRules: [{ kind: "prefix", path: "/website/updates" }],
  },
  {
    id: "website-analytics",
    suiteId: "website",
    title: "Analytics",
    description: "In-depth release and download analytics for the Website.",
    href: "/website/analytics",
    icon: ChartLine,
    activeMatchRules: [{ kind: "exact", path: "/website/analytics" }],
  },
  {
    id: "foundry-home",
    suiteId: "foundry",
    title: "Home",
    description: "Discover and download the unified suite for Subway Builder map creation.",
    href: "/foundry",
    icon: House,
    activeMatchRules: [{ kind: "exact", path: "/foundry" }],
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
    icon: <GithubIcon className={EXTERNAL_ICON_CLASS} aria-hidden="true" />,
  },
];

const SUITE_BY_ID: Record<SiteSuiteId, SiteSuite> = {
  general: SITE_SUITES[0],
  railyard: SITE_SUITES[1],
  registry: SITE_SUITES[2],
  "template-mod": SITE_SUITES[3],
  website: SITE_SUITES[4],
  foundry: SITE_SUITES[5],
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
