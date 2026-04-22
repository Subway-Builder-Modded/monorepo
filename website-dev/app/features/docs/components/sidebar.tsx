import { useState, useCallback, useMemo, useEffect } from "react";
import { PanelLeftOpen, PanelLeftClose, Menu, X, BookText } from "lucide-react";
import {
  SideRailBody,
  SideRailDivider,
  SideRailHeader,
  SideRailShell,
  SideRailUtilityButton,
  SuiteAccentButton,
  SuiteBadge,
} from "@subway-builder-modded/shared-ui";
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

function useCollapsedSections(treeKey: string) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem(`sbm:docs-collapsed:${treeKey}`);
      if (stored) return new Set(JSON.parse(stored) as string[]);
    } catch {
      // ignore persisted state failures
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
          // ignore persisted state failures
        }
        return next;
      });
    },
    [treeKey],
  );

  return { collapsed, toggle };
}

function useSidebarCollapsedState() {
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
      // ignore persisted state failures
    }
  }, []);

  return { sidebarCollapsed, setCollapsedState };
}

function SidebarTitleRow({ suiteId, currentVersion }: { suiteId: DocsSuiteId; currentVersion: DocsRouteVersion }) {
  const suite = getSuiteById(suiteId);

  return (
    <Link
      to={getDocsHomepageUrl(suiteId, currentVersion)}
      className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BookText className="size-4" aria-hidden="true" />
      <span className="text-[15px] font-semibold leading-[1.2] text-foreground">Documentation</span>
      <SuiteBadge
        accent={suite.accent}
        className="h-6 shrink-0 gap-1 rounded-md px-2 normal-case tracking-normal"
      >
        <suite.icon className="size-3 shrink-0" aria-hidden={true} />
        <span className="max-w-[7rem] truncate">{suite.title}</span>
      </SuiteBadge>
    </Link>
  );
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
  const { sidebarCollapsed, setCollapsedState } = useSidebarCollapsedState();

  useEffect(() => {
    onCollapsedChange?.(sidebarCollapsed);
  }, [onCollapsedChange, sidebarCollapsed]);

  if (sidebarCollapsed) {
    return (
      <aside className="hidden w-11 shrink-0 lg:block">
        <div className="sticky top-20 self-start">
          <button
            type="button"
            onClick={() => setCollapsedState(false)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))] bg-background/92 p-0 text-muted-foreground shadow-sm transition-colors",
              "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_34%,transparent)] hover:text-[var(--suite-accent-light)]",
              "dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:hover:text-[var(--suite-accent-dark)]",
            )}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-[17.5rem] shrink-0 lg:block">
      <SideRailShell>
        <SideRailHeader>
          <SidebarTitleRow suiteId={suiteId} currentVersion={currentVersion} />

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
        </SideRailHeader>

        <SideRailDivider />

        <SideRailBody>
          <nav aria-label="Documentation navigation">
            <DocsSidebarTree
              nodes={visibleNodes}
              currentSlug={currentSlug}
              collapsed={collapsed}
              onToggle={toggle}
            />
          </nav>
        </SideRailBody>

        <SideRailDivider />

        <div className="px-2.5 py-2">
          <SideRailUtilityButton
            onClick={() => setCollapsedState(true)}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-3.5" aria-hidden="true" />
            <span>Collapse Sidebar</span>
          </SideRailUtilityButton>
        </div>
      </SideRailShell>
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
