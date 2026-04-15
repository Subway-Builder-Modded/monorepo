import type { SiteIconKey } from "@/app/config/site-icons";

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
  iconKey: SiteIconKey;
  colorSchemeId: SiteColorSchemeId;
  accent: SiteSuiteAccent;
  breadcrumbFallback: string;
};

export type SiteNavItem = {
  id: string;
  suiteId: SiteSuiteId;
  title: string;
  href: string;
  iconKey: SiteIconKey;
  breadcrumb: string;
  description?: string;
  activeMatchRules?: SiteRouteMatchRule[];
};

export type SiteCommunityLink = {
  id: "github" | "discord";
  title: string;
  href: string;
  iconKey: SiteIconKey;
};

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
    iconKey: "logo",
    colorSchemeId: "default",
    accent: GENERAL_ACCENT,
    breadcrumbFallback: "Home",
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
    breadcrumbFallback: "Railyard",
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
    breadcrumbFallback: "Registry",
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
    breadcrumbFallback: "Template Mod",
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
    breadcrumbFallback: "Website",
  },
];

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  {
    id: "general-home",
    suiteId: "general",
    title: "Home",
    href: "/",
    iconKey: "home",
    breadcrumb: "Home",
    activeMatchRules: [{ kind: "exact", path: "/" }],
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
