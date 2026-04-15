import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  SITE_COMMUNITY_LINKS,
  SITE_SUITES,
  getActiveSuite,
  getBreadcrumbLabel,
  getItemsForSuite,
  getMatchingItem,
  getSuiteById,
  type SiteSuiteId,
} from "@/app/config/site-navigation";
import type { NavDropdownOption } from "@subway-builder-modded/shared-ui";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { useNavbarPanelHeight } from "@/app/hooks/use-navbar-panel-height";
import { NAVBAR_MOTION, useNavbarPhase } from "@/app/hooks/use-navbar-phase";
import { useDelayedClose } from "@/app/hooks/use-delayed-close";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { cn } from "@/app/lib/utils";
import { NavbarTopbar } from "./navbar-topbar";
import { NavbarPanel, NavbarPanelContent, NavbarPanelShell } from "./navbar-panel";

type FloatingNavbarProps = {
  pathname: string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const TOP_BAR_HEIGHT = 48;
const NAVBAR_TOP_OFFSET = 16;
const PANEL_MIN_HEIGHT = 84;
const PANEL_BODY_VERTICAL_PADDING = 20;
const PANEL_VIEWPORT_BOTTOM_GUTTER = 24;
const EXPANDED_FRAME_WIDTH_CLASS = "w-[min(72rem,calc(100vw-2rem))]";
const DISCORD_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "discord");
const GITHUB_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "github");

type CommittedPanelMetrics = {
  key: string | null;
  panelHeight: number;
  panelNeedsScroll: boolean;
};

function getNextTheme(theme: ThemeMode): ThemeMode {
  return theme === "light" ? "dark" : "light";
}

function getCollapsedWidthClass(isMobile: boolean, suiteId: SiteSuiteId): string {
  if (isMobile) {
    return "w-[min(24.75rem,calc(100vw-0.75rem))]";
  }

  if (suiteId === "general") {
    return "w-[min(39.5rem,calc(100vw-1.5rem))]";
  }

  return "w-[min(33rem,calc(100vw-1.5rem))]";
}

export function FloatingNavbar({ pathname, theme, setTheme }: FloatingNavbarProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isMobile = useMediaQuery("(max-width: 960px)");
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

  const accentColor = theme === "dark" ? displayedSuite.accent.dark : displayedSuite.accent.light;
  const mutedColor =
    theme === "dark" ? displayedSuite.accent.mutedDark : displayedSuite.accent.mutedLight;
  const realAccent = theme === "dark" ? realSuite.accent.dark : realSuite.accent.light;

  const borderColor = isFrameExpanded
    ? `color-mix(in srgb, ${accentColor} 36%, var(--border))`
    : `color-mix(in srgb, ${realAccent} 36%, var(--border))`;

  const activeItem = useMemo(() => {
    return getMatchingItem(pathname, displayedSuite.id);
  }, [displayedSuite.id, pathname]);

  const breadcrumb = getBreadcrumbLabel(pathname);
  const displayedItems = useMemo(() => getItemsForSuite(displayedSuite.id), [displayedSuite.id]);
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
  }, [hasMeasuredCurrentPanel, panelMeasurementKey, targetPanelHeight, targetPanelNeedsScroll]);

  const panelHeight = committedPanelMetrics.panelHeight;
  const panelNeedsScroll = committedPanelMetrics.panelNeedsScroll;
  const frameHeight = isFrameExpanded ? TOP_BAR_HEIGHT + panelHeight : TOP_BAR_HEIGHT;
  const frameDuration = prefersReducedMotion
    ? 0
    : isFrameExpanded
      ? NAVBAR_MOTION.frameExpandMs / 1000
      : NAVBAR_MOTION.frameCollapseMs / 1000;

  return (
    <>
      {phase !== "closed" ? (
        <motion.button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/35 dark:bg-black/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: showPanelSurface ? 1 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          onClick={closeNavbar}
        />
      ) : null}

      <nav aria-label="Site navigation" className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
        <div
          onPointerEnter={onInteractiveRegionEnter}
          onPointerLeave={onInteractiveRegionLeave}
          className={cn(
            "relative mx-auto transition-[width] ease-[cubic-bezier(.22,.9,.35,1)]",
            isFrameExpanded
              ? EXPANDED_FRAME_WIDTH_CLASS
              : getCollapsedWidthClass(isMobile, realSuite.id),
          )}
          style={{
            transitionDuration: `${prefersReducedMotion ? 0 : isFrameExpanded ? NAVBAR_MOTION.frameExpandMs : NAVBAR_MOTION.frameCollapseMs}ms`,
          }}
        >
          <motion.div
            className="relative overflow-hidden rounded-2xl border-2 bg-background px-3 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)]"
            animate={{ height: frameHeight }}
            transition={{ duration: frameDuration, ease: [0.22, 0.9, 0.35, 1] }}
            style={
              {
                borderColor,
                ["--suite-accent" as string]: isFrameExpanded ? accentColor : realAccent,
                ["--suite-muted" as string]: mutedColor,
              } as CSSProperties
            }
          >
            <div className="relative h-12">
              <NavbarTopbar
                breadcrumb={breadcrumb}
                discordLink={DISCORD_COMMUNITY_LINK}
                githubLink={GITHUB_COMMUNITY_LINK}
                isDropdownOpen={isDropdownOpen}
                isExpanded={isFrameExpanded}
                isMobile={isMobile}
                openSuiteId={openSuiteId}
                realAccent={realAccent}
                realSuite={realSuite}
                suiteOptions={suiteOptions}
                theme={theme}
                onDropdownOpenChange={setIsDropdownOpen}
                onOpenMenu={onMenuClick}
                onCloseMenu={closeNavbar}
                onSuiteChange={onSuiteChange}
                onThemeClick={onThemeClick}
              />
            </div>

            <div
              className="overflow-hidden px-3 pb-3 pt-2"
              style={{ height: isFrameExpanded ? panelHeight : 0 }}
            >
              <motion.div
                animate={{ opacity: showPanelSurface ? 1 : 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : NAVBAR_MOTION.panelSurfaceExitMs / 1000,
                }}
                className={cn("h-full", !showPanelSurface && "pointer-events-none")}
              >
                <div
                  className={cn(
                    "h-full",
                    panelNeedsScroll ? "overflow-y-auto pr-1" : "overflow-visible",
                  )}
                >
                  <NavbarPanel
                    items={displayedItems}
                    activeItem={activeItem}
                    accentColor={accentColor}
                    mutedColor={mutedColor}
                    rowsVisible={showRows}
                    prefersReducedMotion={prefersReducedMotion}
                    onRowClick={onRowClick}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {phase !== "closed" ? (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none invisible fixed left-1/2 top-4 -z-10 -translate-x-1/2",
              EXPANDED_FRAME_WIDTH_CLASS,
            )}
          >
            <div className="rounded-2xl border-2 bg-background px-3 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)]">
              <div className="px-3 pb-3 pt-14">
                <div ref={panelMeasureRef}>
                  <NavbarPanelShell accentColor={accentColor} mutedColor={mutedColor}>
                    <NavbarPanelContent
                      items={displayedItems}
                      activeItem={activeItem}
                      rowsVisible={true}
                      enableRowMotion={false}
                      prefersReducedMotion={true}
                      onRowClick={() => undefined}
                    />
                  </NavbarPanelShell>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </>
  );
}
