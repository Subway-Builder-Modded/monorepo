import { type CSSProperties, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SITE_COMMUNITY_LINKS } from "@/app/config/site-navigation";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { NAVBAR_MOTION } from "@/app/hooks/use-navbar-phase";
import { useNavbarController } from "@/app/hooks/use-navbar-controller";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { cn } from "@/app/lib/utils";
import { NavbarTopbar } from "./navbar-topbar";
import { DesktopNavbarPanel, DesktopNavbarPanelStatic } from "./desktop-navbar-panel";
import { MobileNavbarPanel, MobileNavbarPanelStatic } from "./mobile-navbar-panel";

type FloatingNavbarProps = {
  pathname: string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const UNIFIED_WIDTH_CLASS = "w-[min(72rem,calc(100vw-1.5rem))]";
const DISCORD_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "discord");
const GITHUB_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "github");
const NOOP = () => undefined;

export function FloatingNavbar({ pathname, theme, setTheme }: FloatingNavbarProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isMobile = useMediaQuery("(max-width: 960px)");
  const {
    activeItem,
    activeItemGlobal,
    accentColor,
    allSuiteGroups,
    borderColor,
    breadcrumb,
    closeNavbar,
    displayedItems,
    frameDuration,
    frameHeight,
    phase,
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
    realAccent,
    realSuite,
    showPanelSurface,
    showRows,
    suiteRailItems,
  } = useNavbarController({
    isMobile,
    pathname,
    prefersReducedMotion,
    setTheme,
    theme,
  });

  const onNavbarFocus = useCallback(() => {
    if (phase === "closed") {
      openNavbar();
    }
  }, [openNavbar, phase]);

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

      <nav
        aria-label="Site navigation"
        className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
        onFocusCapture={onNavbarFocus}
      >
        <div className={cn("relative mx-auto", UNIFIED_WIDTH_CLASS)}>
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
                isExpanded={isFrameExpanded}
                isMobile={isMobile}
                realAccent={realAccent}
                realSuite={realSuite}
                theme={theme}
                onMenuClick={onMenuClick}
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
                  {isMobile ? (
                    <MobileNavbarPanel
                      groups={allSuiteGroups}
                      activeItem={activeItemGlobal}
                      rowsVisible={showRows}
                      prefersReducedMotion={prefersReducedMotion}
                      onRowClick={onRowClick}
                    />
                  ) : (
                    <DesktopNavbarPanel
                      suiteRailItems={suiteRailItems}
                      selectedSuiteId={openSuiteId}
                      onSuiteSelect={onSuiteChange}
                      items={displayedItems}
                      activeItem={activeItem}
                      accentColor={accentColor}
                      mutedColor={mutedColor}
                      rowsVisible={showRows}
                      prefersReducedMotion={prefersReducedMotion}
                      onRowClick={onRowClick}
                    />
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Ghost measurement element */}
        {phase !== "closed" ? (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none invisible fixed left-1/2 top-4 -z-10 -translate-x-1/2",
              UNIFIED_WIDTH_CLASS,
            )}
          >
            <div className="rounded-2xl border-2 bg-background px-3 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)]">
              <div className="px-3 pb-3 pt-14">
                <div ref={panelMeasureRef}>
                  {isMobile ? (
                    <MobileNavbarPanelStatic
                      groups={allSuiteGroups}
                      activeItem={activeItemGlobal}
                      onRowClick={NOOP}
                    />
                  ) : (
                    <DesktopNavbarPanelStatic
                      suiteRailItems={suiteRailItems}
                      selectedSuiteId={openSuiteId}
                      items={displayedItems}
                      activeItem={activeItem}
                      accentColor={accentColor}
                      mutedColor={mutedColor}
                      onRowClick={NOOP}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </>
  );
}
