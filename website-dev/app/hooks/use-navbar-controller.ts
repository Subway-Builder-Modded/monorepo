import { useEffect, useMemo, useState } from "react";
import { SITE_NAV_ITEMS, getActiveSuite } from "@/app/config/site-navigation";
import { buildNavbarDisplayModel } from "@/app/components/navigation/navbar-model";
import { TOP_BAR_HEIGHT } from "@/app/hooks/navbar-controller/constants";
import { getTargetPanelMetrics } from "@/app/hooks/navbar-controller/panel-metrics";
import { useCommittedPanelMetrics } from "@/app/hooks/navbar-controller/use-committed-panel-metrics";
import { useNavbarEscapeKey } from "@/app/hooks/navbar-controller/use-navbar-escape-key";
import { useNavbarInteractions } from "@/app/hooks/navbar-controller/use-navbar-interactions";
import { useNavbarViewportHeight } from "@/app/hooks/navbar-controller/use-navbar-viewport-height";
import { useNavbarPanelHeight } from "@/app/hooks/use-navbar-panel-height";
import { NAVBAR_MOTION, useNavbarPhase } from "@/app/hooks/use-navbar-phase";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";

type UseNavbarControllerOptions = {
  isMobile: boolean;
  pathname: string;
  prefersReducedMotion: boolean;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
};

export function useNavbarController({
  isMobile,
  pathname,
  prefersReducedMotion,
  setTheme,
  theme,
}: UseNavbarControllerOptions) {
  const realSuite = useMemo(() => getActiveSuite(pathname), [pathname]);

  const [canStartEnterMotion, setCanStartEnterMotion] = useState(false);

  const { phase, open, close, isFrameExpanded, showPanelSurface, showRows } = useNavbarPhase({
    canStartEnterMotion,
    reducedMotion: prefersReducedMotion,
  });

  const viewportHeight = useNavbarViewportHeight();
  const {
    closeNavbar,
    onFrameClick,
    onFrameHoverEnd,
    onFrameHoverStart,
    onMenuClick,
    onRowClick,
    onSuiteChange,
    onThemeClick,
    openNavbar,
    openSuiteId,
  } = useNavbarInteractions({
    close,
    isFrameExpanded,
    open,
    phase,
    realSuiteId: realSuite.id,
    setTheme,
    theme,
  });

  useNavbarEscapeKey({ onEscape: closeNavbar, phase });

  const displayModel = useMemo(
    () =>
      buildNavbarDisplayModel({
        pathname,
        openSuiteId,
        phase,
        theme,
        isFrameExpanded,
      }),
    [isFrameExpanded, openSuiteId, pathname, phase, theme],
  );

  const {
    displayedItems,
    activeItem,
    activeItemGlobal,
    accentColor,
    mutedColor,
    realAccent,
    borderColor,
    suiteRailItems,
    allSuiteGroups,
  } = displayModel;

  const totalItemCount = SITE_NAV_ITEMS.length;

  const { hasMeasuredCurrentPanel, measuredPanelHeight, panelMeasurementKey, panelMeasureRef } =
    useNavbarPanelHeight({
      enabled: phase !== "closed",
      suiteId: isMobile ? "all" : displayModel.displayedSuite.id,
      itemCount: isMobile ? totalItemCount : displayedItems.length,
      isMobile,
    });

  const { targetPanelHeight, targetPanelNeedsScroll } = getTargetPanelMetrics({
    viewportHeight,
    measuredPanelHeight,
  });

  const committedPanelMetrics = useCommittedPanelMetrics({
    hasMeasuredCurrentPanel,
    panelMeasurementKey,
    phase,
    targetPanelHeight,
    targetPanelNeedsScroll,
  });

  useEffect(() => {
    setCanStartEnterMotion(
      phase === "opening" &&
        hasMeasuredCurrentPanel &&
        committedPanelMetrics.key === panelMeasurementKey,
    );
  }, [committedPanelMetrics.key, hasMeasuredCurrentPanel, panelMeasurementKey, phase]);

  const panelHeight = committedPanelMetrics.panelHeight;
  const panelNeedsScroll = committedPanelMetrics.panelNeedsScroll;
  const frameHeight = isFrameExpanded ? TOP_BAR_HEIGHT + panelHeight : TOP_BAR_HEIGHT;
  const frameDuration = prefersReducedMotion
    ? 0
    : isFrameExpanded
      ? NAVBAR_MOTION.frameExpandMs / 1000
      : NAVBAR_MOTION.frameCollapseMs / 1000;

  return {
    activeItem,
    activeItemGlobal,
    accentColor,
    allSuiteGroups,
    borderColor,
    closeNavbar,
    displayedItems,
    frameDuration,
    frameHeight,
    isFrameExpanded,
    mutedColor,
    onFrameClick,
    onFrameHoverEnd,
    onFrameHoverStart,
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
