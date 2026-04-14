import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/app/lib/router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, MonitorCog, MoonStar, Sun, X } from "lucide-react";
import {
  getActiveSuiteItem,
  getBreadcrumbLabel,
  getSuiteById,
  WEBSITE_DEV_SUITES,
} from "@/app/lib/site-navigation";
import { ShellDropdown, ShellNavCard } from "@subway-builder-modded/shared-ui";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import type { ThemeMode } from "@/app/hooks/use-theme-mode";
import { cn } from "@/app/lib/utils";
import { SiteIcon } from "./site-icon";

type FloatingNavbarProps = {
  pathname: string;
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
};

const THEME_ORDER: ThemeMode[] = ["light", "dark", "system"];

function getNextTheme(theme: ThemeMode): ThemeMode {
  const currentIndex = THEME_ORDER.indexOf(theme);
  const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
  return THEME_ORDER[nextIndex];
}

function ThemeIcon({ theme }: { theme: ThemeMode }) {
  if (theme === "light") {
    return <Sun className="size-4" aria-hidden="true" />;
  }

  if (theme === "dark") {
    return <MoonStar className="size-4" aria-hidden="true" />;
  }

  return <MonitorCog className="size-4" aria-hidden="true" />;
}

export function FloatingNavbar({
  pathname,
  theme,
  resolvedTheme,
  setTheme,
}: FloatingNavbarProps) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 960px)");

  const realSuite = useMemo(() => {
    return (
      WEBSITE_DEV_SUITES.find((suite) => {
        return pathname === suite.href || pathname.startsWith(`${suite.href}/`);
      }) ?? WEBSITE_DEV_SUITES[0]
    );
  }, [pathname]);

  const [openSuiteId, setOpenSuiteId] = useState(realSuite.id);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayedSuite = isExpanded ? getSuiteById(openSuiteId) : realSuite;

  const shownActiveItem = useMemo(() => {
    return getActiveSuiteItem(pathname, displayedSuite.id);
  }, [displayedSuite.id, pathname]);

  useEffect(() => {
    setOpenSuiteId(realSuite.id);
  }, [realSuite.id]);

  const closeNavbar = useCallback(() => {
    setIsExpanded(false);
    setIsPinned(false);
    setIsDropdownOpen(false);
    setOpenSuiteId(realSuite.id);
  }, [realSuite.id]);

  const expandedBreadcrumb =
    displayedSuite.id === "subway-builder-modded"
      ? "Home"
      : `${displayedSuite.title} / ${getBreadcrumbLabel(pathname, displayedSuite.id)}`;

  useEffect(() => {
    if (!isExpanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNavbar();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeNavbar, isExpanded]);

  const onPointerEnter = useCallback(() => {
    if (isMobile) return;
    setIsExpanded(true);
  }, [isMobile]);

  const onPointerLeave = useCallback(() => {
    if (isMobile || isPinned) return;
    setIsExpanded(false);
    setIsDropdownOpen(false);
    setOpenSuiteId(realSuite.id);
  }, [isMobile, isPinned, realSuite.id]);

  const onMenuClick = useCallback(() => {
    setIsExpanded(true);
    setIsPinned(true);
    setOpenSuiteId(realSuite.id);
  }, [realSuite.id]);

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

  const accentColor = resolvedTheme === "dark" ? displayedSuite.accent.dark : displayedSuite.accent.light;
  const accentContrast =
    resolvedTheme === "dark"
      ? displayedSuite.accent.textInvertedDark
      : displayedSuite.accent.textInvertedLight;

  const realAccent = resolvedTheme === "dark" ? realSuite.accent.dark : realSuite.accent.light;

  const openDuration = prefersReducedMotion ? 0 : 0.26;

  const suiteOptions = WEBSITE_DEV_SUITES.map((suite) => ({
    id: suite.id,
    label: suite.title,
    icon: <SiteIcon iconKey={suite.iconKey} className="size-4" />,
  }));

  return (
    <>
      <AnimatePresence>
        {isExpanded ? (
          <motion.button
            key="shell-overlay"
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: openDuration }}
            onClick={closeNavbar}
          />
        ) : null}
      </AnimatePresence>

      <nav
        aria-label="Site navigation"
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
        className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
      >
        <div
          className={cn(
            "mx-auto transition-[width,border-radius] duration-300 ease-[cubic-bezier(.22,.9,.35,1)]",
            isExpanded
              ? "w-[min(78rem,calc(100vw-1.5rem))]"
              : "w-[min(24rem,calc(100vw-1rem))] sm:w-[min(38rem,calc(100vw-1.5rem))]",
          )}
        >
          <div
            className={cn(
              "rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--suite-accent)_42%,var(--border))]",
              "bg-background px-3 shadow-[0_10px_32px_-24px_color-mix(in_srgb,var(--suite-accent)_58%,transparent)]",
              isExpanded && "rounded-[1.2rem]",
            )}
            style={
              {
                ["--suite-accent" as string]: accentColor,
                ["--suite-accent-contrast" as string]: accentContrast,
              } as CSSProperties
            }
          >
            <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3">
              <div className="min-w-0">
                {isExpanded ? (
                  <ShellDropdown
                    options={suiteOptions}
                    selectedId={openSuiteId}
                    isOpen={isDropdownOpen}
                    onOpenChange={setIsDropdownOpen}
                    onSelect={onSuiteChange}
                    triggerLabel="Select suite"
                    className="text-[color:var(--suite-accent)]"
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

              <p className="truncate text-center text-sm text-muted-foreground">
                {isExpanded ? expandedBreadcrumb : getBreadcrumbLabel(pathname, realSuite.id)}
              </p>

              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={onThemeClick}
                  aria-label={`Switch theme. Current theme ${theme}`}
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ThemeIcon theme={theme} />
                </button>

                {isExpanded ? (
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
            {isExpanded ? (
              <motion.div
                key="suite-panel"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: openDuration }}
                className="mt-2 rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--suite-accent)_42%,var(--border))] bg-background p-3.5 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.48)]"
                style={
                  {
                    ["--suite-accent" as string]: accentColor,
                    ["--suite-accent-contrast" as string]: accentContrast,
                  } as CSSProperties
                }
              >
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayedSuite.items.map((item) => {
                    const isActive = shownActiveItem.id === item.id;
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={onCardClick}
                        aria-current={isActive ? "page" : undefined}
                        className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ShellNavCard
                          title={item.title}
                          description={item.description}
                          icon={<SiteIcon iconKey={item.iconKey} className="size-6" />}
                          active={isActive}
                        />
                      </Link>
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
