import { type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SITE_COMMUNITY_LINKS, type SiteSuiteId } from "@/app/config/site-navigation";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { NAVBAR_MOTION } from "@/app/hooks/use-navbar-phase";
import { useNavbarController } from "@/app/hooks/use-navbar-controller";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { cn } from "@/app/lib/utils";
import { NavbarTopbar } from "./navbar-topbar";
import { NavbarPanel, NavbarPanelContent, NavbarPanelShell } from "./navbar-panel";

type FloatingNavbarProps = {
  pathname: string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const EXPANDED_FRAME_WIDTH_CLASS = "w-[min(72rem,calc(100vw-2rem))]";
const DISCORD_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "discord");
const GITHUB_COMMUNITY_LINK = SITE_COMMUNITY_LINKS.find((link) => link.id === "github");
const NOOP = () => undefined;

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
  const {
    activeItem,
    accentColor,
    borderColor,
    breadcrumb,
    closeNavbar,
    displayedItems,
    frameDuration,
    frameHeight,
    isDropdownOpen,
    phase,
    isFrameExpanded,
    mutedColor,
    onDropdownOpenChange,
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
    realAccent,
    realSuite,
    showPanelSurface,
    showRows,
    suiteOptions,
  } = useNavbarController({
    isMobile,
    pathname,
    prefersReducedMotion,
    setTheme,
    theme,
  });

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
                onDropdownOpenChange={onDropdownOpenChange}
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
                      onRowClick={NOOP}
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
