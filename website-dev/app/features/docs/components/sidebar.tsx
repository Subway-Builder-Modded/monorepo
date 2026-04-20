import { useState, useCallback, useMemo, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react";
import { SuiteBadge, SuiteAccentButton } from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { isVersionedDocsSuite, type DocsRouteVersion } from "@/app/config/docs";
import { getSuiteById } from "@/app/config/site-navigation";
import type { DocsTreeNode, DocsTree } from "@/app/features/docs/lib/types";
import type { DocsSuiteId } from "@/app/config/docs";
import { DocsVersionChooser } from "./docs-version-chooser";
import { DocsSidebarTree, nodeIsActiveInMiniRail } from "./docs-sidebar-tree";

const SIDEBAR_COLLAPSED_KEY = "sbm:docs-sidebar-collapsed";

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

function MiniRail({
  nodes,
  currentSlug,
  suiteId,
  currentVersion,
  onExpand,
}: {
  nodes: DocsTreeNode[];
  currentSlug: string | null;
  suiteId: DocsSuiteId;
  currentVersion: DocsRouteVersion;
  onExpand: () => void;
}) {
  const suite = getSuiteById(suiteId);
  const SuiteIcon = suite.icon;

  return (
    <div className="flex h-full flex-col items-center gap-2 px-2 py-2">
      <SuiteBadge
        size="sm"
        className="h-8 w-8 items-center justify-center rounded-lg p-0 tracking-normal"
        accent={suite.accent}
        aria-label={`${suite.title} documentation`}
      >
        <SuiteIcon className="size-4" aria-hidden={true} />
      </SuiteBadge>

      <SuiteAccentButton
        type="button"
        tone="outline"
        onClick={onExpand}
        className="h-8 w-8 rounded-lg p-0"
        aria-label="Expand sidebar"
      >
        <PanelLeftOpen className="size-4" />
      </SuiteAccentButton>

      <nav
        className="mt-1 flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-thin"
        aria-label="Collapsed documentation navigation"
      >
        <ul className="space-y-1">
          {nodes.map((node) => {
            const Icon = resolveIcon(node.frontmatter.icon);
            const active = nodeIsActiveInMiniRail(node, currentSlug);
            return (
              <li key={node.slug}>
                <Link
                  to={node.routePath}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors",
                    active
                      ? "border-[color-mix(in_srgb,var(--suite-accent-light)_35%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:text-[var(--suite-accent-dark)]"
                      : "text-muted-foreground hover:bg-muted/45 hover:text-foreground",
                  )}
                  title={node.frontmatter.title}
                >
                  <Icon className="size-4" aria-hidden={true} />
                  <span className="sr-only">{node.frontmatter.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {isVersionedDocsSuite(suiteId) && currentVersion ? (
        <span className="pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {currentVersion}
        </span>
      ) : null}
    </div>
  );
}

export function DocsSidebar({
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

  return (
    <aside className="hidden shrink-0 lg:block">
      <div
        className={cn(
          "transition-[width] duration-300 ease-[cubic-bezier(.22,.9,.35,1)]",
          sidebarCollapsed ? "w-[4.75rem]" : "w-[19rem]",
        )}
      >
        <div className="sticky top-20 h-[calc(100vh-6rem)] rounded-2xl border-2 border-border/70 bg-background/92 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35)] backdrop-blur-md">
          {sidebarCollapsed ? (
            <MiniRail
              nodes={visibleNodes}
              currentSlug={currentSlug}
              suiteId={suiteId}
              currentVersion={currentVersion}
              onExpand={() => setCollapsedState(false)}
            />
          ) : (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="border-b border-border/50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Link to={getDocsHomepageUrl(suiteId, currentVersion)} className="min-w-0">
                    <SuiteBadge
                      accent={suite.accent}
                      className="max-w-full gap-1.5 rounded-lg normal-case tracking-normal"
                    >
                      <suite.icon className="size-3.5" aria-hidden={true} />
                      <span className="truncate">{suite.title} Documentation</span>
                    </SuiteBadge>
                  </Link>
                  <SuiteAccentButton
                    type="button"
                    tone="outline"
                    onClick={() => setCollapsedState(true)}
                    className="h-8 w-8 rounded-lg p-0"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="size-4" />
                  </SuiteAccentButton>
                </div>

                {isVersionedDocsSuite(suiteId) && currentVersion ? (
                  <DocsVersionChooser
                    suiteId={suiteId}
                    currentVersion={currentVersion}
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
          )}
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
                      <span className="truncate">{suite.title} Documentation</span>
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

                {isVersionedDocsSuite(suiteId) && currentVersion ? (
                  <DocsVersionChooser
                    suiteId={suiteId}
                    currentVersion={currentVersion}
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
