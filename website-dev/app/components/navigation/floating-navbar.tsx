import { type CSSProperties, type MouseEvent, useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SITE_SHELL_CLASS } from "@subway-builder-modded/shared-ui";
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

const DISCORD_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "discord");
const GITHUB_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "github");
const NOOP = () => undefined;
const FRAME_EASE: [number, number, number, number] = [0.22, 0.9, 0.35, 1];

export function FloatingNavbar({ pathname, theme, setTheme }: FloatingNavbarProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isMobile = useMediaQuery("(max-width: 960px)");
  const {
    activeItem,
    activeItemGlobal,
    accentColor,
    allSuiteGroups,
    borderColor,
    closeNavbar,
    displayedItems,
    frameDuration,
    frameHeight,
    phase,
    isFrameExpanded,
    mutedColor,
    onFrameClick,
    onFrameHoverEnd,
    onFrameHoverStart,
    onMenuClick,
    onRowClick,
    onSuiteChange,
    onThemeClick,
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

  const onCollapsedSurfaceClick = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("a, button")) return;
      onFrameClick();
    },
    [onFrameClick],
  );

  const isClosed = phase === "closed";
  const [isNavbarHovered, setIsNavbarHovered] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const isHoverAnimated = isNavbarHovered && !prefersReducedMotion && isClosed;
  const frameScale = isHoverAnimated ? 1.007 : 1;
  const disableInitialClosedAnimation = !hasMounted && isClosed;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <>
      {!isClosed ? (
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

      <nav aria-label="Site navigation" className="fixed inset-x-0 top-4 z-50">
        <div className={cn(SITE_SHELL_CLASS, "relative")}>
          <motion.div
            initial={false}
            onClick={onCollapsedSurfaceClick}
            onHoverStart={() => {
              setIsNavbarHovered(true);
              onFrameHoverStart();
            }}
            onHoverEnd={() => {
              setIsNavbarHovered(false);
              onFrameHoverEnd();
            }}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl border-2 bg-background px-3 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)]",
              isClosed && "cursor-pointer transition-shadow duration-200 ease-out",
              isNavbarHovered && "shadow-[0_14px_30px_-14px_rgba(0,0,0,0.5)]",
            )}
            animate={{
              height: frameHeight,
              scale: frameScale,
            }}
            transition={{
              height: {
                duration: disableInitialClosedAnimation ? 0 : frameDuration,
                ease: FRAME_EASE,
              },
              scale: {
                duration: disableInitialClosedAnimation || prefersReducedMotion ? 0 : 0.16,
                ease: FRAME_EASE,
              },
            }}
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
                initial={false}
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
        {phase !== "closed" ? (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none invisible fixed inset-x-0 top-4 -z-10",
              SITE_SHELL_CLASS,
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
