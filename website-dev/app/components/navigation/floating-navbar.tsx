import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@/app/lib/router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronRight, SunMoon, X } from "lucide-react";
import {
  getActiveSuiteItem,
  getBreadcrumbLabel,
  getSuiteById,
  WEBSITE_DEV_SUITES,
} from "@/app/lib/site-navigation";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { cn } from "@/app/lib/utils";
import { SiteIcon } from "./site-icon";
import { SuiteNavCard } from "./suite-nav-card";

type FloatingNavbarProps = {
  pathname: string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const THEME_ORDER: ThemeMode[] = ["light", "dark", "system"];

function getNextTheme(theme: ThemeMode): ThemeMode {
  const currentIndex = THEME_ORDER.indexOf(theme);
  const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
  return THEME_ORDER[nextIndex];
}

export function FloatingNavbar({ pathname, theme, setTheme }: FloatingNavbarProps) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 960px)");

  const activeSuite = useMemo(() => {
    return (
      WEBSITE_DEV_SUITES.find((suite) => {
        return pathname === suite.href || pathname.startsWith(`${suite.href}/`);
      }) ?? WEBSITE_DEV_SUITES[0]
    );
  }, [pathname]);

  const activeItem = useMemo(() => {
    return getActiveSuiteItem(pathname, activeSuite.id);
  }, [activeSuite.id, pathname]);

  const [selectedSuiteId, setSelectedSuiteId] = useState(activeSuite.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const selectedSuite = getSuiteById(selectedSuiteId);
  const selectedActiveItem = getActiveSuiteItem(pathname, selectedSuiteId);

  useEffect(() => {
    setSelectedSuiteId(activeSuite.id);
  }, [activeSuite.id]);

  const closeAll = useCallback(() => {
    setIsOpen(false);
    setIsPinned(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAll();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeAll, isOpen]);

  useEffect(() => {
    if (!isMobile && isPinned && !isOpen) {
      setIsOpen(true);
    }
  }, [isMobile, isOpen, isPinned]);

  const onPointerEnter = useCallback(() => {
    if (isMobile) return;
    setIsOpen(true);
  }, [isMobile]);

  const onPointerLeave = useCallback(() => {
    if (isMobile || isPinned) return;
    setIsOpen(false);
  }, [isMobile, isPinned]);

  const onPillClick = useCallback(() => {
    if (isMobile) {
      setIsOpen(true);
      setIsPinned(true);
      return;
    }

    if (!isOpen) {
      setIsOpen(true);
      setIsPinned(true);
      return;
    }

    if (!isPinned) {
      setIsPinned(true);
    }
  }, [isMobile, isOpen, isPinned]);

  const onThemeClick = useCallback(() => {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);
  }, [setTheme, theme]);

  const onSuiteChange = useCallback(
    (nextSuiteId: string) => {
      const suite = getSuiteById(nextSuiteId as typeof selectedSuiteId);
      setSelectedSuiteId(suite.id);
      setIsOpen(true);

      if (suite.href !== pathname) {
        navigate(suite.href);
      }
    },
    [navigate, pathname],
  );

  const openDuration = prefersReducedMotion ? 0 : 0.24;

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.button
            key="navbar-overlay"
            aria-label="Close navigation overlay"
            onClick={closeAll}
            className="fixed inset-0 z-40 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: openDuration }}
          />
        ) : null}
      </AnimatePresence>

      <nav
        className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
        aria-label="Primary"
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
      >
        <div
          className={cn(
            "relative rounded-[2rem] border backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(.22,.9,.35,1)]",
            "bg-[hsl(var(--navbar)/0.92)] border-[color:color-mix(in_srgb,var(--suite-accent-light)_35%,var(--border))]",
            "dark:border-[color:color-mix(in_srgb,var(--suite-accent-dark)_38%,var(--border))]",
            "shadow-[0_8px_30px_-20px_color-mix(in_srgb,var(--suite-accent-light)_62%,transparent)]",
            "dark:shadow-[0_8px_34px_-20px_color-mix(in_srgb,var(--suite-accent-dark)_62%,transparent)]",
            isOpen
              ? "w-[min(70rem,calc(100vw-1.5rem))] rounded-[1.5rem]"
              : "w-[min(34rem,calc(100vw-1.5rem))]",
          )}
          style={{
            ["--suite-accent-light" as string]: selectedSuite.accent.light,
            ["--suite-accent-dark" as string]: selectedSuite.accent.dark,
            ["--suite-text-inverted-light" as string]: selectedSuite.accent.textInvertedLight,
            ["--suite-text-inverted-dark" as string]: selectedSuite.accent.textInvertedDark,
          }}
        >
          <div className="absolute inset-x-6 top-0 signage-line h-[2px]" />

          <button
            type="button"
            onClick={onPillClick}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Pin navigation open" : "Expand navigation"}
            className="relative block h-14 w-full rounded-[inherit] px-3 text-left"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center gap-3 px-4 transition-all duration-200",
                isOpen ? "opacity-0" : "opacity-100",
              )}
              aria-hidden={isOpen}
            >
              <span className="inline-flex size-8 items-center justify-center rounded-xl bg-[var(--surface-raised)]">
                <SiteIcon iconKey={activeSuite.iconKey} className="size-4" />
              </span>
              <span className="truncate text-sm font-semibold">{activeSuite.title}</span>
              <span className="text-muted-foreground">⟋</span>
              <span className="truncate text-sm text-muted-foreground">
                {getBreadcrumbLabel(activeItem)}
              </span>
            </div>

            <div
              className={cn(
                "pointer-events-none absolute inset-0 grid grid-cols-1 gap-2 px-4 py-2 transition-all duration-200 md:grid-cols-[minmax(0,1fr)_auto]",
                isOpen ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!isOpen}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-raised)]">
                  <SiteIcon iconKey={selectedSuite.iconKey} className="size-4" />
                </span>
                <span className="hidden truncate text-sm font-semibold sm:block">
                  {selectedSuite.title}
                </span>

                <label className="sr-only" htmlFor="suite-selector">
                  Select suite
                </label>
                <select
                  id="suite-selector"
                  value={selectedSuiteId}
                  onChange={(event) => onSuiteChange(event.target.value)}
                  className="pointer-events-auto h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Select suite"
                >
                  {WEBSITE_DEV_SUITES.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.title}
                    </option>
                  ))}
                </select>

                <span className="hidden min-w-0 items-center gap-1 text-xs text-muted-foreground md:flex">
                  {selectedActiveItem.breadcrumb.map((crumb) => (
                    <span className="inline-flex items-center gap-1" key={crumb}>
                      <ChevronRight className="size-3" aria-hidden="true" />
                      <span className="truncate">{crumb}</span>
                    </span>
                  ))}
                </span>
              </div>

              <div className="pointer-events-auto flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2 text-xs font-medium transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={onThemeClick}
                  aria-label={`Switch theme. Current theme ${theme}`}
                >
                  <SunMoon className="size-3.5" />
                  <span className="capitalize">{theme}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={closeAll}
                  aria-label="Close navigation"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              key="suite-panel"
              className="mt-2 w-[min(70rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--suite-accent-light)_35%,var(--border))] bg-[hsl(var(--navbar)/0.95)] p-4 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.65)] dark:border-[color:color-mix(in_srgb,var(--suite-accent-dark)_38%,var(--border))]"
              style={{
                ["--suite-accent-light" as string]: selectedSuite.accent.light,
                ["--suite-accent-dark" as string]: selectedSuite.accent.dark,
                ["--suite-text-inverted-light" as string]: selectedSuite.accent.textInvertedLight,
                ["--suite-text-inverted-dark" as string]: selectedSuite.accent.textInvertedDark,
              }}
              initial={{ opacity: 0, y: -6, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.985 }}
              transition={{ duration: openDuration }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {selectedSuite.items.map((item) => {
                  const itemIsActive = selectedActiveItem.id === item.id;

                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={() => {
                        if (isMobile) {
                          closeAll();
                        }
                      }}
                      aria-current={itemIsActive ? "page" : undefined}
                      className="rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <SuiteNavCard suite={selectedSuite} item={item} active={itemIsActive} />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </>
  );
}
