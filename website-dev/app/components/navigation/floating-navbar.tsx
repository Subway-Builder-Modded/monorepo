import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/app/lib/router";
import { motion, useReducedMotion } from "motion/react";
import { House, Menu, MoonStar, Sun, X } from "lucide-react";
import {
  SITE_COMMUNITY_LINKS,
  SITE_SUITES,
  getActiveSuite,
  getBreadcrumbLabel,
  getItemsForSuite,
  getMatchingItem,
  getSuiteById,
} from "@/app/lib/site-navigation";
import { ShellDropdown } from "@subway-builder-modded/shared-ui";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { NAVBAR_MOTION, useNavbarPhase } from "@/app/hooks/use-navbar-phase";
import { useDelayedClose } from "@/app/hooks/use-delayed-close";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { cn } from "@/app/lib/utils";
import { SiteIcon } from "./site-icon";
import { NavbarPanel } from "./navbar-panel";
import type { SiteSuiteId } from "@/app/lib/site-navigation";

type FloatingNavbarProps = {
  pathname: string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const TOP_BAR_HEIGHT = 48;
const TOP_BAR_SIDE_ZONE_DESKTOP = 248;
const TOP_BAR_SIDE_ZONE_MOBILE = 188;

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

  const realSuite = useMemo(() => {
    return getActiveSuite(pathname);
  }, [pathname]);

  const [openSuiteId, setOpenSuiteId] = useState<SiteSuiteId>(realSuite.id);
  const [isPinned, setIsPinned] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const communityHrefById = useMemo(() => {
    const map = new Map<string, string>();
    for (const link of SITE_COMMUNITY_LINKS) {
      map.set(link.id, link.href);
    }
    return map;
  }, []);

  const discordHref = communityHrefById.get("discord") ?? "https://discord.gg/syG9YHMyeG";
  const githubHref = communityHrefById.get("github") ?? "https://github.com/Subway-Builder-Modded";

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

  const onInteractiveRegionEnter = useCallback(() => {
    cancelClose();
    if (!isMobile) {
      open();
    }
  }, [cancelClose, isMobile, open]);

  const onInteractiveRegionLeave = useCallback(() => {
    if (!allowHoverClose || isTransitionLocked || isMobile || isPinned) {
      return;
    }
    scheduleClose();
  }, [allowHoverClose, isTransitionLocked, isMobile, isPinned, scheduleClose]);

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

  const displayedSuite = isFrameExpanded ? getSuiteById(openSuiteId) : realSuite;

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

  const suiteOptions = useMemo(
    () =>
      SITE_SUITES.map((suite) => ({
        id: suite.id,
        label: suite.title,
        icon: <SiteIcon iconKey={suite.iconKey} className="size-4" />,
        tone: {
          color: theme === "dark" ? suite.accent.dark : suite.accent.light,
          muted: theme === "dark" ? suite.accent.mutedDark : suite.accent.mutedLight,
        },
      })),
    [theme],
  );

  const panelHeight = displayedItems.length > 1 ? 204 : displayedItems.length === 1 ? 150 : 84;
  const frameHeight = isFrameExpanded ? TOP_BAR_HEIGHT + panelHeight : TOP_BAR_HEIGHT;
  const sideZoneWidth = isMobile ? TOP_BAR_SIDE_ZONE_MOBILE : TOP_BAR_SIDE_ZONE_DESKTOP;
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
              ? "w-[min(72rem,calc(100vw-2rem))]"
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
              <div className="absolute inset-0">
                <div
                  className="absolute left-0 top-0 flex h-full min-w-0 items-center pr-2"
                  style={{ width: sideZoneWidth }}
                >
                  {isFrameExpanded ? (
                    <ShellDropdown
                      options={suiteOptions}
                      selectedId={openSuiteId}
                      isOpen={isDropdownOpen}
                      onOpenChange={setIsDropdownOpen}
                      onSelect={onSuiteChange}
                      triggerLabel="Select suite"
                      className="w-full text-[color:var(--suite-accent)] [&>button]:px-0"
                      menuClassName="border border-border"
                    />
                  ) : (
                    <div
                      className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold leading-tight"
                      style={{ color: realAccent }}
                    >
                      <SiteIcon iconKey={realSuite.iconKey} className="size-4 shrink-0" />
                      {!isMobile ? (
                        <span className="truncate leading-normal">{realSuite.title}</span>
                      ) : null}
                    </div>
                  )}
                </div>

                <p
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 truncate text-sm font-semibold leading-tight text-foreground sm:text-base"
                  style={{ maxWidth: `calc(100% - ${sideZoneWidth * 2 + 16}px)` }}
                >
                  {breadcrumb}
                </p>

                <div
                  className="absolute right-0 top-0 flex h-full items-center justify-end gap-1 pl-2"
                  style={{ width: sideZoneWidth }}
                >
                  <Link
                    to="/"
                    aria-label="Go to home"
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <House className="size-4" aria-hidden="true" />
                  </Link>
                  <a
                    href={discordHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open Discord"
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <SiteIcon iconKey="discord" className="size-4" />
                  </a>
                  <a
                    href={githubHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open GitHub"
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <SiteIcon iconKey="github" className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={onThemeClick}
                    aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {theme === "light" ? (
                      <Sun className="size-4" aria-hidden="true" />
                    ) : (
                      <MoonStar className="size-4" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={isFrameExpanded ? "Close navigation" : "Open navigation"}
                    onClick={isFrameExpanded ? closeNavbar : onMenuClick}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {isFrameExpanded ? (
                      <X className="size-4" aria-hidden="true" />
                    ) : (
                      <Menu className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div
              className="overflow-hidden px-3 pb-3 pt-2"
              style={{ height: Math.max(frameHeight - TOP_BAR_HEIGHT, 0) }}
            >
              <motion.div
                animate={{ opacity: showPanelSurface ? 1 : 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : NAVBAR_MOTION.panelSurfaceExitMs / 1000,
                }}
                className={cn(!showPanelSurface && "pointer-events-none")}
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
              </motion.div>
            </div>
          </motion.div>
        </div>
      </nav>
    </>
  );
}
