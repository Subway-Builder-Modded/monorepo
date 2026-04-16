import { useCallback, useEffect, useMemo, useState } from "react";
import type { NavDropdownOption } from "@subway-builder-modded/shared-ui";
import {
  SITE_SUITES,
  getActiveSuite,
  getBreadcrumbLabel,
  getItemsForSuite,
  getMatchingItem,
  getSuiteById,
  type SiteSuiteId,
} from "@/app/config/site-navigation";
import { useDelayedClose } from "@/app/hooks/use-delayed-close";
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
  const [isPinned, setIsPinned] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    setIsDropdownOpen(false);
    setIsPinned(false);
  }, [realSuite.id]);

  const {
    phase,
    open,
    close,
    isFrameExpanded,
    showPanelSurface,
    showRows,
    allowHoverClose,
    isTransitionLocked,
  } = useNavbarPhase({
    canStartEnterMotion,
    onFullyClosed,
    reducedMotion: prefersReducedMotion,
  });

  const closeNavbar = useCallback(() => {
    setIsDropdownOpen(false);
    setIsPinned(false);
    close();
  }, [close]);

  const { schedule: scheduleClose, cancel: cancelClose } = useDelayedClose({
    delayMs: 150,
    onClose: closeNavbar,
    disabled: isMobile || isPinned,
  });

  useEffect(() => {
    if (phase === "closed") {
      setOpenSuiteId(realSuite.id);
    }
  }, [phase, realSuite.id]);

  useEffect(() => {
    if (phase === "closing") {
      setIsDropdownOpen(false);
    }
  }, [phase]);

  useEffect(() => {
    const onResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onInteractiveRegionEnter = useCallback(() => {
    cancelClose();
    if (!isMobile) {
      open();
    }
  }, [cancelClose, isMobile, open]);

  const onInteractiveRegionLeave = useCallback(() => {
    if (!allowHoverClose || isTransitionLocked || isMobile || isPinned || isDropdownOpen) {
      return;
    }
    scheduleClose();
  }, [allowHoverClose, isTransitionLocked, isMobile, isPinned, isDropdownOpen, scheduleClose]);

  const onMenuClick = useCallback(() => {
    cancelClose();
    setIsPinned(true);
    setOpenSuiteId(realSuite.id);
    open();
  }, [cancelClose, open, realSuite.id]);

  const onSuiteChange = useCallback((suiteId: string) => {
    setOpenSuiteId(suiteId as SiteSuiteId);
  }, []);

  const onThemeClick = useCallback(() => {
    setTheme(getNextTheme(theme));
  }, [setTheme, theme]);

  const onRowClick = useCallback(() => {
    if (isMobile || isPinned) {
      closeNavbar();
    }
  }, [closeNavbar, isMobile, isPinned]);

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

  const { hasMeasuredCurrentPanel, measuredPanelHeight, panelMeasurementKey, panelMeasureRef } =
    useNavbarPanelHeight({
      enabled: phase !== "closed",
      suiteId: displayedSuite.id,
      itemCount: displayedItems.length,
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

  const suiteOptions = useMemo(
    () =>
      SITE_SUITES.map((suite) => ({
        id: suite.id,
        label: suite.title,
        icon: suite.icon,
        tone: {
          color: theme === "dark" ? suite.accent.dark : suite.accent.light,
          muted: theme === "dark" ? suite.accent.mutedDark : suite.accent.mutedLight,
        },
      })) satisfies NavDropdownOption[],
    [theme],
  );

  return {
    activeItem,
    accentColor,
    borderColor,
    breadcrumb: getBreadcrumbLabel(pathname),
    closeNavbar,
    displayedItems,
    frameDuration,
    frameHeight,
    isDropdownOpen,
    isFrameExpanded,
    mutedColor,
    onDropdownOpenChange: setIsDropdownOpen,
    onInteractiveRegionEnter,
    onInteractiveRegionLeave,
    onMenuClick,
    onRowClick,
    onSuiteChange,
    onThemeClick,
    openSuiteId,
    panelHeight,
    panelMeasureRef,
    panelNeedsScroll,
    phase,
    realAccent,
    realSuite,
    showPanelSurface,
    showRows,
    suiteOptions,
  };
}
