import { useState, useCallback, useMemo, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react";
import { SuiteBadge, SuiteAccentButton } from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { hasMultipleVisibleVersions, type DocsRouteVersion } from "@/app/config/docs";
import { getSuiteById } from "@/app/config/site-navigation";
import type { DocsTree } from "@/app/features/docs/lib/types";
import type { DocsSuiteId } from "@/app/config/docs";
import { DocsVersionChooser } from "./docs-version-chooser";
import { DocsSidebarTree } from "./docs-sidebar-tree";

const SIDEBAR_COLLAPSED_KEY = "sbm:docs-sidebar-collapsed";
const DOCS_SURFACE_BORDER_CLASS =
  "border-2 border-[color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))]";

function useCollapsedSections(treeKey: string) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem(`sbm:docs-collapsed:${treeKey}`);
      if (stored) return new Set(JSON.parse(stored) as string[]);
    } catch {
      // ignore
    }
    return new Set();
  });

  const toggle = useCallback(
    (slug: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) {
          next.delete(slug);
        } else {
          next.add(slug);
        }
        try {
          sessionStorage.setItem(`sbm:docs-collapsed:${treeKey}`, JSON.stringify([...next]));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [treeKey],
  );

  return { collapsed, toggle };
}

export function DocsSidebar({
  tree,
  suiteId,
  currentVersion,
  currentSlug,
  onCollapsedChange,
}: {
  tree: DocsTree;
  suiteId: DocsSuiteId;
  currentVersion: DocsRouteVersion;
  currentSlug: string | null;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const treeKey = `${suiteId}:${currentVersion ?? "__no_version__"}`;
  const { collapsed, toggle } = useCollapsedSections(treeKey);
  const visibleNodes = useMemo(() => getVisibleNodes(tree.nodes), [tree]);
  const suite = getSuiteById(suiteId);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setCollapsedState = useCallback((next: boolean) => {
    setSidebarCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    onCollapsedChange?.(sidebarCollapsed);
  }, [onCollapsedChange, sidebarCollapsed]);

  return (
    <aside className="relative hidden shrink-0 lg:block">
      {sidebarCollapsed ? (
        <div className="sticky top-20 h-0 w-0 overflow-visible">
          <button
            type="button"
            onClick={() => setCollapsedState(false)}
            className={cn(
              "absolute left-0 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))] bg-background/92 p-0 text-muted-foreground shadow-sm transition-colors",
              "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_34%,transparent)] hover:text-[var(--suite-accent-light)]",
              "dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:hover:text-[var(--suite-accent-dark)]",
            )}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "transition-[width,opacity] duration-300 ease-[cubic-bezier(.22,.9,.35,1)]",
          sidebarCollapsed ? "w-0 opacity-0" : "w-[17.5rem] opacity-100",
        )}
      >
        <div
          className={cn(
            "sticky top-20 self-start rounded-2xl bg-background/92 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)] backdrop-blur-md",
            DOCS_SURFACE_BORDER_CLASS,
          )}
        >
          {/*
            Collapse button is absolutely positioned in the top-right corner so
            it never competes for inline space inside the header rows. Without
            this, the suite badge could be squeezed/truncated by the button.
          */}
          <button
            type="button"
            onClick={() => setCollapsedState(true)}
            className={cn(
              "absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
              "hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)]",
              "dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]",
            )}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>

          <div className="border-b border-border/50 px-3 py-3">
            <span className="block pr-9 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Documentation
            </span>

            <Link to={getDocsHomepageUrl(suiteId, currentVersion)} className="mt-2 block min-w-0">
              <SuiteBadge
                accent={suite.accent}
                className="h-7 w-full justify-start gap-1.5 rounded-md px-2 normal-case tracking-normal"
              >
                <suite.icon className="size-3.5 shrink-0" aria-hidden={true} />
                <span className="truncate">{suite.title}</span>
              </SuiteBadge>
            </Link>

            {hasMultipleVisibleVersions(suiteId) && currentVersion ? (
              <div className="mt-2">
                <DocsVersionChooser
                  suiteId={suiteId}
                  currentVersion={currentVersion}
                  docSlug={currentSlug}
                  triggerClassName="w-full"
                />
              </div>
            ) : null}
          </div>

          <nav className="px-2.5 py-3" aria-label="Documentation navigation">
            <DocsSidebarTree
              nodes={visibleNodes}
              currentSlug={currentSlug}
              collapsed={collapsed}
              onToggle={toggle}
            />
          </nav>
        </div>
      </div>
    </aside>
  );
}

export function MobileDocsSidebar({
  tree,
  suiteId,
  currentVersion,
  currentSlug,
}: {
  tree: DocsTree;
  suiteId: DocsSuiteId;
  currentVersion: DocsRouteVersion;
  currentSlug: string | null;
}) {
  const [open, setOpen] = useState(false);
  const treeKey = `${suiteId}:${currentVersion ?? "__no_version__"}`;
  const { collapsed, toggle } = useCollapsedSections(treeKey);
  const visibleNodes = useMemo(() => getVisibleNodes(tree.nodes), [tree]);
  const suite = getSuiteById(suiteId);

  useEffect(() => {
    setOpen(false);
  }, [currentSlug, currentVersion]);

  return (
    <div className="lg:hidden">
      <SuiteAccentButton
        type="button"
        tone="outline"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 px-3 text-xs"
        aria-label="Open navigation menu"
      >
        <Menu className="size-3.5" />
        Documentation Menu
      </SuiteAccentButton>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-[min(86vw,22rem)] rounded-r-2xl border-r-2 border-border/70 bg-background/95 shadow-xl backdrop-blur-md">
            <div className="flex h-full flex-col overflow-hidden">
              <div className="border-b border-border/50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Link to={getDocsHomepageUrl(suiteId, currentVersion)} className="min-w-0">
                    <SuiteBadge
                      accent={suite.accent}
                      className="max-w-full gap-1.5 rounded-lg normal-case tracking-normal"
                    >
                      <suite.icon className="size-3.5" aria-hidden={true} />
                      <span className="truncate">{suite.title}</span>
                    </SuiteBadge>
                  </Link>
                  <SuiteAccentButton
                    type="button"
                    tone="outline"
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 rounded-lg p-0"
                    aria-label="Close navigation menu"
                  >
                    <X className="size-4" />
                  </SuiteAccentButton>
                </div>

                {hasMultipleVisibleVersions(suiteId) && currentVersion ? (
                  <DocsVersionChooser
                    suiteId={suiteId}
                    currentVersion={currentVersion}
                    docSlug={currentSlug}
                    triggerClassName="w-full"
                  />
                ) : null}
              </div>

              <nav
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 scrollbar-thin"
                aria-label="Documentation navigation"
              >
                <DocsSidebarTree
                  nodes={visibleNodes}
                  currentSlug={currentSlug}
                  collapsed={collapsed}
                  onToggle={toggle}
                />
              </nav>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
