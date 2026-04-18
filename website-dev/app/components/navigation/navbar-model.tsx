import type { ReactNode } from "react";
import {
  SITE_SUITES,
  getActiveSuite,
  getBreadcrumbLabel,
  getItemsForSuite,
  getMatchingItem,
  getSuiteById,
  type SiteNavItem,
  type SiteSuiteId,
} from "@/app/config/site-navigation";
import type { NavbarPhase } from "@/app/hooks/use-navbar-phase";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";

const SUITE_ICON_CLASS = "size-4";

type BuildNavbarDisplayModelOptions = {
  pathname: string;
  openSuiteId: SiteSuiteId;
  phase: NavbarPhase;
  theme: ThemeMode;
  isFrameExpanded: boolean;
};

export type NavbarSuiteRailItem = {
  id: SiteSuiteId;
  title: string;
  icon: ReactNode;
  accentColor: string;
  mutedColor: string;
};

export type NavbarMobileSuiteGroup = {
  id: SiteSuiteId;
  title: string;
  icon: ReactNode;
  items: SiteNavItem[];
  accentColor: string;
  mutedColor: string;
};

export type NavbarDisplayModel = {
  realSuite: ReturnType<typeof getActiveSuite>;
  displayedSuite: ReturnType<typeof getActiveSuite>;
  displayedItems: SiteNavItem[];
  activeItem: SiteNavItem | null;
  activeItemGlobal: SiteNavItem | null;
  breadcrumb: string;
  accentColor: string;
  mutedColor: string;
  realAccent: string;
  borderColor: string;
  suiteRailItems: NavbarSuiteRailItem[];
  allSuiteGroups: NavbarMobileSuiteGroup[];
};

function getSuiteAccent(theme: ThemeMode, accent: (typeof SITE_SUITES)[number]["accent"]) {
  return {
    accentColor: theme === "dark" ? accent.dark : accent.light,
    mutedColor: theme === "dark" ? accent.mutedDark : accent.mutedLight,
  };
}

export function buildNavbarDisplayModel({
  pathname,
  openSuiteId,
  phase,
  theme,
  isFrameExpanded,
}: BuildNavbarDisplayModelOptions): NavbarDisplayModel {
  const realSuite = getActiveSuite(pathname);
  const displayedSuite = phase === "closed" ? realSuite : getSuiteById(openSuiteId);
  const displayedItems = getItemsForSuite(displayedSuite.id);
  const activeItem = getMatchingItem(pathname, displayedSuite.id);
  const activeItemGlobal = getMatchingItem(pathname, realSuite.id);

  const { accentColor, mutedColor } = getSuiteAccent(theme, displayedSuite.accent);
  const realAccent = theme === "dark" ? realSuite.accent.dark : realSuite.accent.light;

  const borderColor = isFrameExpanded
    ? `color-mix(in srgb, ${accentColor} 36%, var(--border))`
    : `color-mix(in srgb, ${realAccent} 36%, var(--border))`;

  const suiteRailItems = SITE_SUITES.map((suite) => {
    const SuiteIcon = suite.icon;
    const suiteColors = getSuiteAccent(theme, suite.accent);

    return {
      id: suite.id,
      title: suite.title,
      icon: <SuiteIcon className={SUITE_ICON_CLASS} aria-hidden={true} />,
      accentColor: suiteColors.accentColor,
      mutedColor: suiteColors.mutedColor,
    } satisfies NavbarSuiteRailItem;
  });

  const allSuiteGroups = SITE_SUITES.map((suite) => {
    const SuiteIcon = suite.icon;
    const suiteColors = getSuiteAccent(theme, suite.accent);

    return {
      id: suite.id,
      title: suite.title,
      icon: <SuiteIcon className={SUITE_ICON_CLASS} aria-hidden={true} />,
      items: getItemsForSuite(suite.id),
      accentColor: suiteColors.accentColor,
      mutedColor: suiteColors.mutedColor,
    } satisfies NavbarMobileSuiteGroup;
  });

  return {
    realSuite,
    displayedSuite,
    displayedItems,
    activeItem,
    activeItemGlobal,
    breadcrumb: getBreadcrumbLabel(pathname),
    accentColor,
    mutedColor,
    realAccent,
    borderColor,
    suiteRailItems,
    allSuiteGroups,
  };
}
