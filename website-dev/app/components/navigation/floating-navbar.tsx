import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/app/lib/router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, MoonStar, Sun, X } from "lucide-react";
import {
  SITE_SUITES,
  getActiveSuiteItem,
  getBreadcrumbLabel,
  getSuiteById,
} from "@/app/lib/site-navigation";
import { ShellDropdown, ShellNavCard } from "@subway-builder-modded/shared-ui";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { cn } from "@/app/lib/utils";
import { SiteIcon } from "./site-icon";

type FloatingNavbarProps = {
  pathname: string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const CLOSE_DELAY_MS = 150;

function getNextTheme(theme: ThemeMode): ThemeMode {
  return theme === "light" ? "dark" : "light";
}

export function FloatingNavbar({ pathname, theme, setTheme }: FloatingNavbarProps) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 960px)");
  const closeTimerRef = useRef<number | null>(null);

  const realSuite = useMemo(() => {
    return (
      SITE_SUITES.find(
        (suite) => pathname === suite.href || pathname.startsWith(`${suite.href}/`),
      ) ?? SITE_SUITES[0]
    );
  }, [pathname]);

  const [openSuiteId, setOpenSuiteId] = useState(realSuite.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayedSuite = isOpen ? getSuiteById(openSuiteId) : realSuite;

  const shownActiveItem = useMemo(() => {
    return getActiveSuiteItem(pathname, displayedSuite.id);
  }, [displayedSuite.id, pathname]);

  useEffect(() => {
    if (!isOpen) {
      setOpenSuiteId(realSuite.id);
    }
  }, [isOpen, realSuite.id]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  const closeNavbar = useCallback(() => {
    clearCloseTimer();
    setIsOpen(false);
    setIsPinned(false);
    setIsDropdownOpen(false);
    setOpenSuiteId(realSuite.id);
  }, [clearCloseTimer, realSuite.id]);

  const scheduleClose = useCallback(() => {
    if (isMobile || isPinned) {
      return;
    }

    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsDropdownOpen(false);
      setOpenSuiteId(realSuite.id);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer, isMobile, isPinned, realSuite.id]);

  const onInteractiveRegionEnter = useCallback(() => {
    clearCloseTimer();
    if (!isMobile) {
      setIsOpen(true);
    }
  }, [clearCloseTimer, isMobile]);

  const onInteractiveRegionLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  const onMenuClick = useCallback(() => {
    clearCloseTimer();
    setIsOpen(true);
    setIsPinned(true);
    setOpenSuiteId(realSuite.id);
  }, [clearCloseTimer, realSuite.id]);

  const onSuiteChange = useCallback((suiteId: string) => {
    setOpenSuiteId(suiteId as typeof openSuiteId);
  }, []);

  const onCardClick = useCallback(() => {
    if (isMobile || isPinned) {
      closeNavbar();
    }
  }, [closeNavbar, isMobile, isPinned]);

  const onThemeClick = useCallback(() => {
    setTheme(getNextTheme(theme));
  }, [setTheme, theme]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNavbar();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeNavbar, isOpen]);

  const accentColor = theme === "dark" ? displayedSuite.accent.dark : displayedSuite.accent.light;
  const accentContrast =
    theme === "dark"
      ? displayedSuite.accent.textInvertedDark
      : displayedSuite.accent.textInvertedLight;
  const realAccent = theme === "dark" ? realSuite.accent.dark : realSuite.accent.light;

  const barDuration = prefersReducedMotion ? 0 : 0.29;
  const panelDuration = prefersReducedMotion ? 0 : 0.24;
  const panelDelay = prefersReducedMotion ? 0 : 0.1;

  const suiteOptions = SITE_SUITES.map((suite) => ({
    id: suite.id,
    label: suite.title,
    icon: <SiteIcon iconKey={suite.iconKey} className="size-4" />,
    tone: {
      color: theme === "dark" ? suite.accent.dark : suite.accent.light,
      contrast: theme === "dark" ? suite.accent.textInvertedDark : suite.accent.textInvertedLight,
    },
  }));

  const breadcrumb = getBreadcrumbLabel(pathname, displayedSuite.id);

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.button
            key="navbar-overlay"
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: panelDuration }}
            onClick={closeNavbar}
          />
        ) : null}
      </AnimatePresence>

      <nav aria-label="Site navigation" className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
        <div
          onPointerEnter={onInteractiveRegionEnter}
          onPointerLeave={onInteractiveRegionLeave}
          className={cn(
            "relative mx-auto pb-2 transition-[width] ease-[cubic-bezier(.22,.9,.35,1)]",
            isOpen
              ? "w-[min(78rem,calc(100vw-1.5rem))]"
              : "w-[min(23.5rem,calc(100vw-1rem))] sm:w-[min(31rem,calc(100vw-1.5rem))]",
          )}
          style={{ transitionDuration: `${barDuration * 1000}ms` }}
        >
          <div
            className={cn(
              "relative border-2 border-[color:color-mix(in_srgb,var(--suite-accent)_48%,var(--border))] bg-background px-3",
              "shadow-[0_14px_32px_-24px_color-mix(in_srgb,var(--suite-accent)_56%,transparent)]",
              isOpen ? "rounded-t-2xl rounded-b-none" : "rounded-full",
            )}
            style={
              {
                ["--suite-accent" as string]: accentColor,
                ["--suite-accent-contrast" as string]: accentContrast,
              } as CSSProperties
            }
          >
            <div className="relative flex h-12 items-center">
              <div className="min-w-0 max-w-[48%]">
                {isOpen ? (
                  <ShellDropdown
                    options={suiteOptions}
                    selectedId={openSuiteId}
                    isOpen={isDropdownOpen}
                    onOpenChange={setIsDropdownOpen}
                    onSelect={onSuiteChange}
                    triggerLabel="Select suite"
                    className="text-[color:var(--suite-accent)] [&>button]:px-0"
                    menuClassName="border-2"
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

              <p className="pointer-events-none absolute left-1/2 max-w-[54%] -translate-x-1/2 truncate text-base font-semibold text-foreground">
                {breadcrumb}
              </p>

              <div className="ml-auto flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={onThemeClick}
                  aria-label={`Switch theme. Current theme ${theme}`}
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {theme === "light" ? (
                    <Sun className="size-4" aria-hidden="true" />
                  ) : (
                    <MoonStar className="size-4" aria-hidden="true" />
                  )}
                </button>

                {isOpen ? (
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

          <AnimatePresence>
            {isOpen ? (
              <motion.div
                key="suite-panel"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: panelDuration,
                  delay: panelDelay,
                  ease: [0.22, 0.9, 0.35, 1],
                }}
                className="rounded-b-2xl border-x-2 border-b-2 border-[color:color-mix(in_srgb,var(--suite-accent)_48%,var(--border))] bg-background px-3 pb-3 pt-2"
                style={
                  {
                    ["--suite-accent" as string]: accentColor,
                    ["--suite-accent-contrast" as string]: accentContrast,
                  } as CSSProperties
                }
              >
                <div className="mb-2 flex items-center">
                  <span className="h-1.5 w-16 rounded-full bg-[color:var(--suite-accent)]" />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayedSuite.items.map((item, index) => {
                    const isActive = shownActiveItem.id === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                          duration: panelDuration,
                          delay: panelDelay + index * 0.03,
                          ease: [0.22, 0.9, 0.35, 1],
                        }}
                      >
                        <Link
                          to={item.href}
                          onClick={onCardClick}
                          aria-current={isActive ? "page" : undefined}
                          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ShellNavCard
                            title={item.title}
                            description={item.description}
                            icon={<SiteIcon iconKey={item.iconKey} className="size-6" />}
                            active={isActive}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
}
