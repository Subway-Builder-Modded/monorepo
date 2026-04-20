import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { SuiteStatusChip } from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import {
  getVisibleVersions,
  getDocsVersion,
  getEnabledDocsSuiteIds,
  isVersionedDocsSuite,
  type DocsRouteVersion,
} from "@/app/config/docs";
import { getSuiteById } from "@/app/config/site-navigation";
import type { DocsTreeNode, DocsTree } from "@/app/features/docs/lib/types";
import type { DocsSuiteId } from "@/app/config/docs";

const SIDEBAR_COLLAPSED_KEY = "sbm:docs-sidebar-collapsed";

function SuiteRail({
  activeSuiteId,
  currentVersion,
}: {
  activeSuiteId: DocsSuiteId;
  currentVersion: DocsRouteVersion;
}) {
  const suiteIds = getEnabledDocsSuiteIds();

  return (
    <div className="flex flex-col items-center gap-1 border-r border-border/30 px-1.5 py-3">
      {suiteIds.map((id) => {
        const suite = getSuiteById(id);
        const isActive = id === activeSuiteId;
        const SuiteIcon = suite.icon;

        return (
          <Link
            key={id}
            to={getDocsHomepageUrl(id, id === activeSuiteId ? currentVersion : null)}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-[var(--suite-accent-light)]/12 dark:bg-[var(--suite-accent-dark)]/12 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40",
            )}
            aria-label={`${suite.title} docs`}
            aria-current={isActive ? "true" : undefined}
            data-color-scheme={id}
          >
            <SuiteIcon className="size-4" aria-hidden={true} />
          </Link>
        );
      })}
    </div>
  );
}

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
          sessionStorage.setItem(
            `sbm:docs-collapsed:${treeKey}`,
            JSON.stringify([...next]),
          );
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

function VersionSwitcher({
  suiteId,
  currentVersion,
}: {
  suiteId: DocsSuiteId;
  currentVersion: DocsRouteVersion;
}) {
  const isVersioned = isVersionedDocsSuite(suiteId);
  const versions = getVisibleVersions(suiteId);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!isVersioned || !currentVersion || versions.length <= 1) return null;

  const currentConfig = getDocsVersion(suiteId, currentVersion);
  const statusLabel = currentConfig?.status === "latest" ? "latest" : currentConfig?.status;

  return (
    <div ref={containerRef} className="relative mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-border/50 bg-muted/30",
          "px-2.5 text-xs font-medium text-foreground outline-none transition-colors",
          "hover:border-border focus-visible:ring-2 focus-visible:ring-ring/60",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select documentation version"
      >
        <span className="flex items-center gap-2">
          <span>{currentVersion}</span>
          {statusLabel && (
            <SuiteStatusChip
              status={currentConfig?.status === "latest" ? "latest" : "deprecated"}
              deprecatedTone="gray"
              size="sm"
              label={statusLabel}
            />
          )}
        </span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-lg border border-border bg-background p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
          <ul role="listbox" aria-label="Documentation versions">
            {versions.map((v) => {
              const isSelected = v.value === currentVersion;
              return (
                <li key={v.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setOpen(false);
                      const url = getDocsHomepageUrl(suiteId, v.value);
                      window.history.pushState({}, "", url);
                      window.dispatchEvent(new Event("sbm:navigate"));
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-[var(--suite-accent-light)]/10 dark:bg-[var(--suite-accent-dark)]/10 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] font-medium"
                        : "text-foreground/80 hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <span>{v.label}</span>
                    {v.status === "deprecated" && (
                      <SuiteStatusChip status="deprecated" deprecatedTone="gray" size="sm" />
                    )}
                    {v.status === "latest" && (
                      <SuiteStatusChip status="latest" size="sm" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SidebarItem({
  node,
  currentSlug,
  collapsed,
  onToggle,
}: {
  node: DocsTreeNode;
  currentSlug: string | null;
  collapsed: Set<string>;
  onToggle: (slug: string) => void;
}) {
  const isActive = currentSlug === node.slug;
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.slug);
  const visibleChildren = getVisibleNodes(node.children);

  const Icon = resolveIcon(node.frontmatter.icon);

  return (
    <li>
      <div className="flex items-center">
        <Link
          to={node.routePath}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] leading-snug transition-colors",
            isActive
              ? "bg-[var(--suite-accent-light)]/10 dark:bg-[var(--suite-accent-dark)]/10 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] font-medium"
              : "text-foreground/70 hover:bg-muted/50 hover:text-foreground",
          )}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className="size-3.5 shrink-0 opacity-60" aria-hidden={true} />
          <span className="truncate">{node.frontmatter.title}</span>
        </Link>
        {hasChildren && visibleChildren.length > 0 && (
          <button
            type="button"
            onClick={() => onToggle(node.slug)}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        )}
      </div>
      {hasChildren && !isCollapsed && visibleChildren.length > 0 && (
        <ul className="ml-3 mt-0.5 border-l border-border/30 pl-2.5 space-y-0.5">
          {visibleChildren.map((child) => (
            <SidebarItem
              key={child.slug}
              node={child}
              currentSlug={currentSlug}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
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

  const [sidebarHidden, setSidebarHidden] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = useCallback(() => {
    setSidebarHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const suite = getSuiteById(suiteId);

  if (sidebarHidden) {
    return (
      <div className="hidden lg:flex shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)]">
          <SuiteRail activeSuiteId={suiteId} currentVersion={currentVersion} />
          <button
            type="button"
            onClick={toggleSidebar}
            className="mt-2 mx-auto flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden lg:flex shrink-0">
      <div className="sticky top-20 flex max-h-[calc(100vh-6rem)]">
        <SuiteRail activeSuiteId={suiteId} currentVersion={currentVersion} />

        <nav
          className="w-56 overflow-y-auto overscroll-contain pl-3 pr-2 pb-8 scrollbar-thin"
          aria-label="Documentation navigation"
        >
          <div className="flex items-center justify-between mb-3">
            <Link
              to={getDocsHomepageUrl(suiteId, currentVersion)}
              className="text-xs font-bold uppercase tracking-wider text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] hover:opacity-80 transition-opacity"
            >
              {suite.title}
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-3.5" />
            </button>
          </div>

          <VersionSwitcher suiteId={suiteId} currentVersion={currentVersion} />

          <ul className="space-y-0.5">
            {visibleNodes.map((node) => (
              <SidebarItem
                key={node.slug}
                node={node}
                currentSlug={currentSlug}
                collapsed={collapsed}
                onToggle={toggle}
              />
            ))}
          </ul>
        </nav>
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

  // Close on navigation
  useEffect(() => {
    setOpen(false);
  }, [currentSlug, currentVersion]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
        aria-label="Open navigation menu"
      >
        <Menu className="size-3.5" />
        Menu
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex max-w-[85vw] bg-background border-r border-border/50 shadow-xl">
            <SuiteRail activeSuiteId={suiteId} currentVersion={currentVersion} />
            <div className="w-60 overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <Link
                  to={getDocsHomepageUrl(suiteId, currentVersion)}
                  className="text-xs font-bold uppercase tracking-wider text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                >
                  {getSuiteById(suiteId).title}
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-4">
                <VersionSwitcher suiteId={suiteId} currentVersion={currentVersion} />
                <ul className="space-y-0.5">
                  {visibleNodes.map((node) => (
                    <SidebarItem
                      key={node.slug}
                      node={node}
                      currentSlug={currentSlug}
                      collapsed={collapsed}
                      onToggle={toggle}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
