import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Menu, MoonStar, Sun, X } from "lucide-react";
import {
  SITE_SUITES,
  getBreadcrumbLabel,
  getMatchingNavItem,
  getSuiteById,
} from "@/app/lib/site-navigation";
import { ShellDropdown } from "@subway-builder-modded/shared-ui";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { useNavbarPhase } from "@/app/hooks/use-navbar-phase";
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

function getNextTheme(theme: ThemeMode): ThemeMode {
  return theme === "light" ? "dark" : "light";
}

export function FloatingNavbar({ pathname, theme, setTheme }: FloatingNavbarProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isMobile = useMediaQuery("(max-width: 960px)");

  // --- Resolve the real suite from the current URL ---
  const realSuite = useMemo(() => {
    return (
      SITE_SUITES.find(
        (suite) => pathname === suite.href || pathname.startsWith(`${suite.href}/`),
      ) ?? SITE_SUITES[0]
    );
  }, [pathname]);

  // --- Suite shown in the open panel (may differ from realSuite via dropdown) ---
  const [openSuiteId, setOpenSuiteId] = useState<SiteSuiteId>(realSuite.id);
  const [isPinned, setIsPinned] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Called when navbar fully transitions to closed state
  const onFullyClosed = useCallback(() => {
    setOpenSuiteId(realSuite.id);
  }, [realSuite.id]);

  const { phase, open, close, isBarWide, isPanelMounted, areRowsVisible } = useNavbarPhase({
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

  // Sync openSuiteId to realSuite when navbar starts opening
  useEffect(() => {
    if (phase === "opening") {
      setOpenSuiteId(realSuite.id);
    }
  }, [phase, realSuite.id]);

  // --- Hover region handlers ---
  const onInteractiveRegionEnter = useCallback(() => {
    cancelClose();
    if (!isMobile) {
      open();
    }
  }, [cancelClose, isMobile, open]);

  const onInteractiveRegionLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  // --- Button handlers ---
  const onMenuClick = useCallback(() => {
    cancelClose();
    setIsPinned(true);
    setOpenSuiteId(realSuite.id);
    open();
  }, [cancelClose, open, realSuite.id]);

  const onSuiteChange = useCallback((suiteId: string) => {
    setOpenSuiteId(suiteId as SiteSuiteId);
  }, []);

  const onRowClick = useCallback(() => {
    if (isMobile || isPinned) {
      closeNavbar();
    }
  }, [closeNavbar, isMobile, isPinned]);

  const onThemeClick = useCallback(() => {
    setTheme(getNextTheme(theme));
  }, [setTheme, theme]);

  // --- Escape key ---
  useEffect(() => {
    if (phase === "closed") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNavbar();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeNavbar, phase]);

  // --- Derived values ---
  const displayedSuite = isPanelMounted ? getSuiteById(openSuiteId) : realSuite;

  const accentColor = theme === "dark" ? displayedSuite.accent.dark : displayedSuite.accent.light;
  const accentContrast =
    theme === "dark"
      ? displayedSuite.accent.textInvertedDark
      : displayedSuite.accent.textInvertedLight;

  const realAccent = theme === "dark" ? realSuite.accent.dark : realSuite.accent.light;

  const borderColor = isBarWide
    ? `color-mix(in srgb, ${accentColor} 36%, var(--border))`
    : `color-mix(in srgb, ${realAccent} 36%, var(--border))`;

  const barExpandDuration = prefersReducedMotion ? 0 : 300;

  // Active item — null if no actual route match (not a fallback)
  const activeItem = useMemo(() => {
    return getMatchingNavItem(pathname, displayedSuite.id);
  }, [displayedSuite.id, pathname]);

  const breadcrumb = getBreadcrumbLabel(pathname, realSuite.id);

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

  return (
    <>
      {/* Overlay — only mounted during open/closing phases */}
      {isPanelMounted ? (
        <motion.button
          key="navbar-overlay"
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: areRowsVisible ? 1 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={closeNavbar}
        />
      ) : null}

      <nav aria-label="Site navigation" className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
        <div
          onPointerEnter={onInteractiveRegionEnter}
          onPointerLeave={onInteractiveRegionLeave}
          className={cn(
            "relative mx-auto transition-[width] ease-[cubic-bezier(.22,.9,.35,1)]",
            isBarWide
              ? "w-[min(72rem,calc(100vw-2rem))]"
              : "w-[min(22rem,calc(100vw-1rem))] sm:w-[min(30rem,calc(100vw-1.5rem))]",
          )}
          style={{ transitionDuration: `${barExpandDuration}ms` }}
        >
          {/* Top bar */}
          <div
            className={cn(
              "bg-background px-3 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.28)]",
              isBarWide
                ? "rounded-t-2xl border-x-2 border-t-2 border-b-0"
                : "rounded-full border-2",
            )}
            style={
              {
                borderColor,
                ["--suite-accent" as string]: isBarWide ? accentColor : realAccent,
                ["--suite-accent-contrast" as string]: accentContrast,
              } as CSSProperties
            }
          >
            <div className="relative flex h-12 items-center">
              {/* Left: suite dropdown (open) or suite name (collapsed) */}
              <div className="min-w-0 max-w-[46%]">
                {isBarWide ? (
                  <ShellDropdown
                    options={suiteOptions}
                    selectedId={openSuiteId}
                    isOpen={isDropdownOpen}
                    onOpenChange={setIsDropdownOpen}
                    onSelect={onSuiteChange}
                    triggerLabel="Select suite"
                    className="text-[color:var(--suite-accent)] [&>button]:px-0"
                    menuClassName="border border-border"
                  />
                ) : (
                  <div
                    className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold"
                    style={{ color: realAccent }}
                  >
                    <SiteIcon iconKey={realSuite.iconKey} className="size-4 shrink-0" />
                    <span className="truncate">{realSuite.title}</span>
                  </div>
                )}
              </div>

              {/* Center: breadcrumb (absolute for true centering) */}
              <p className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-base font-semibold text-foreground">
                {breadcrumb}
              </p>

              {/* Right: theme toggle + open/close button */}
              <div className="ml-auto flex shrink-0 items-center gap-1">
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

                {isBarWide ? (
                  <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={closeNavbar}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Open navigation"
                    onClick={onMenuClick}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Menu className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Panel — only mounted during open and closing phases */}
          {isPanelMounted ? (
            <NavbarPanel
              suite={displayedSuite}
              activeItem={activeItem}
              accentColor={accentColor}
              accentContrast={accentContrast}
              rowsVisible={areRowsVisible}
              prefersReducedMotion={prefersReducedMotion}
              onRowClick={onRowClick}
            />
          ) : null}
        </div>
      </nav>
    </>
  );
}
