import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SITE_NAV_ITEMS,
  SITE_SUITES,
  getActiveSuite,
  getBreadcrumbLabel,
  getItemsForSuite,
  getMatchingItem,
  getSuiteById,
  type SiteSuiteId,
} from "@/app/config/site-navigation";
import type { SuiteRailItem } from "@/app/components/navigation/suite-rail";
import type { SuiteGroup } from "@/app/components/navigation/mobile-navbar-panel";
import { useNavbarPanelHeight } from "@/app/hooks/use-navbar-panel-height";
import { NAVBAR_MOTION, useNavbarPhase } from "@/app/hooks/use-navbar-phase";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";

const TOP_BAR_HEIGHT = 48;
const NAVBAR_TOP_OFFSET = 16;
const PANEL_MIN_HEIGHT = 84;
const PANEL_BODY_VERTICAL_PADDING = 20;
const PANEL_VIEWPORT_BOTTOM_GUTTER = 24;

type CommittedPanelMetrics = {
  key: string | null;
  panelHeight: number;
  panelNeedsScroll: boolean;
};

type UseNavbarControllerOptions = {
  isMobile: boolean;
  pathname: string;
  prefersReducedMotion: boolean;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
};

function getNextTheme(theme: ThemeMode): ThemeMode {
  return theme === "light" ? "dark" : "light";
}

export function useNavbarController({
  isMobile,
  pathname,
  prefersReducedMotion,
  setTheme,
  theme,
}: UseNavbarControllerOptions) {
  const realSuite = useMemo(() => getActiveSuite(pathname), [pathname]);

  const [openSuiteId, setOpenSuiteId] = useState<SiteSuiteId>(realSuite.id);
  const [canStartEnterMotion, setCanStartEnterMotion] = useState(false);
  const [committedPanelMetrics, setCommittedPanelMetrics] = useState<CommittedPanelMetrics>({
    key: null,
    panelHeight: PANEL_MIN_HEIGHT,
    panelNeedsScroll: false,
  });
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 900 : window.innerHeight,
  );

  const onFullyClosed = useCallback(() => {
    setOpenSuiteId(realSuite.id);
  }, [realSuite.id]);

  const { phase, open, close, isFrameExpanded, showPanelSurface, showRows } = useNavbarPhase({
    canStartEnterMotion,
    onFullyClosed,
    reducedMotion: prefersReducedMotion,
  });

  const closeNavbar = useCallback(() => {
    close();
  }, [close]);

  useEffect(() => {
    if (phase === "closed") {
      setOpenSuiteId(realSuite.id);
    }
  }, [phase, realSuite.id]);

  useEffect(() => {
    const onResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const openNavbar = useCallback(() => {
    if (phase === "closed") {
      setOpenSuiteId(realSuite.id);
      open();
    }
  }, [open, phase, realSuite.id]);

  const onMenuClick = useCallback(() => {
    if (isFrameExpanded) {
      closeNavbar();
    } else {
      openNavbar();
    }
  }, [closeNavbar, isFrameExpanded, openNavbar]);

  const onSuiteChange = useCallback((suiteId: SiteSuiteId) => {
    setOpenSuiteId(suiteId);
  }, []);

  const onThemeClick = useCallback(() => {
    setTheme(getNextTheme(theme));
  }, [setTheme, theme]);

  const onRowClick = useCallback(() => {
    closeNavbar();
  }, [closeNavbar]);

  useEffect(() => {
    if (phase === "closed") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNavbar();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeNavbar, phase]);

  const displayedSuite = phase === "closed" ? realSuite : getSuiteById(openSuiteId);
  const displayedItems = useMemo(() => getItemsForSuite(displayedSuite.id), [displayedSuite.id]);
  const activeItem = useMemo(() => {
    return getMatchingItem(pathname, displayedSuite.id);
  }, [displayedSuite.id, pathname]);
  const activeItemGlobal = useMemo(() => {
    return getMatchingItem(pathname, realSuite.id);
  }, [pathname, realSuite.id]);

  // For mobile: measurement uses all items; for desktop: current suite items
  const totalItemCount = SITE_NAV_ITEMS.length;

  const { hasMeasuredCurrentPanel, measuredPanelHeight, panelMeasurementKey, panelMeasureRef } =
    useNavbarPanelHeight({
      enabled: phase !== "closed",
      suiteId: isMobile ? "all" : displayedSuite.id,
      itemCount: isMobile ? totalItemCount : displayedItems.length,
      isMobile,
    });

  useEffect(() => {
    if (phase === "closed") {
      setCanStartEnterMotion(false);
      return;
    }

    setCanStartEnterMotion(
      phase === "opening" &&
        hasMeasuredCurrentPanel &&
        committedPanelMetrics.key === panelMeasurementKey,
    );
  }, [committedPanelMetrics.key, hasMeasuredCurrentPanel, panelMeasurementKey, phase]);

  const accentColor = theme === "dark" ? displayedSuite.accent.dark : displayedSuite.accent.light;
  const mutedColor =
    theme === "dark" ? displayedSuite.accent.mutedDark : displayedSuite.accent.mutedLight;
  const realAccent = theme === "dark" ? realSuite.accent.dark : realSuite.accent.light;

  const maxPanelHeight = Math.max(
    PANEL_MIN_HEIGHT,
    viewportHeight - NAVBAR_TOP_OFFSET - TOP_BAR_HEIGHT - PANEL_VIEWPORT_BOTTOM_GUTTER,
  );
  const measuredNaturalPanelHeight = Math.max(
    PANEL_MIN_HEIGHT,
    measuredPanelHeight + PANEL_BODY_VERTICAL_PADDING,
  );
  const targetPanelHeight = Math.min(measuredNaturalPanelHeight, maxPanelHeight);
  const targetPanelNeedsScroll = measuredNaturalPanelHeight > maxPanelHeight;

  useEffect(() => {
    if (phase === "closed") {
      setCommittedPanelMetrics({
        key: null,
        panelHeight: PANEL_MIN_HEIGHT,
        panelNeedsScroll: false,
      });
      return;
    }

    if (!hasMeasuredCurrentPanel) {
      return;
    }

    setCommittedPanelMetrics((previousMetrics) => {
      if (
        previousMetrics.key === panelMeasurementKey &&
        previousMetrics.panelHeight === targetPanelHeight &&
        previousMetrics.panelNeedsScroll === targetPanelNeedsScroll
      ) {
        return previousMetrics;
      }

      return {
        key: panelMeasurementKey,
        panelHeight: targetPanelHeight,
        panelNeedsScroll: targetPanelNeedsScroll,
      };
    });
  }, [
    hasMeasuredCurrentPanel,
    panelMeasurementKey,
    phase,
    targetPanelHeight,
    targetPanelNeedsScroll,
  ]);

  const panelHeight = committedPanelMetrics.panelHeight;
  const panelNeedsScroll = committedPanelMetrics.panelNeedsScroll;
  const frameHeight = isFrameExpanded ? TOP_BAR_HEIGHT + panelHeight : TOP_BAR_HEIGHT;
  const frameDuration = prefersReducedMotion
    ? 0
    : isFrameExpanded
      ? NAVBAR_MOTION.frameExpandMs / 1000
      : NAVBAR_MOTION.frameCollapseMs / 1000;

  const borderColor = isFrameExpanded
    ? `color-mix(in srgb, ${accentColor} 36%, var(--border))`
    : `color-mix(in srgb, ${realAccent} 36%, var(--border))`;

  const suiteRailItems = useMemo(
    () =>
      SITE_SUITES.map((suite) => ({
        id: suite.id,
        title: suite.title,
        icon: suite.icon,
        accentColor: theme === "dark" ? suite.accent.dark : suite.accent.light,
        mutedColor: theme === "dark" ? suite.accent.mutedDark : suite.accent.mutedLight,
      })) satisfies SuiteRailItem[],
    [theme],
  );

  const allSuiteGroups = useMemo(
    () =>
      SITE_SUITES.map((suite) => ({
        suite,
        items: getItemsForSuite(suite.id),
        accentColor: theme === "dark" ? suite.accent.dark : suite.accent.light,
        mutedColor: theme === "dark" ? suite.accent.mutedDark : suite.accent.mutedLight,
      })) satisfies SuiteGroup[],
    [theme],
  );

  return {
    activeItem,
    activeItemGlobal,
    accentColor,
    allSuiteGroups,
    borderColor,
    breadcrumb: getBreadcrumbLabel(pathname),
    closeNavbar,
    displayedItems,
    frameDuration,
    frameHeight,
    isFrameExpanded,
    mutedColor,
    onMenuClick,
    onRowClick,
    onSuiteChange,
    onThemeClick,
    openNavbar,
    openSuiteId,
    panelHeight,
    panelMeasureRef,
    panelNeedsScroll,
    phase,
    realAccent,
    realSuite,
    showPanelSurface,
    showRows,
    suiteRailItems,
  };
}
