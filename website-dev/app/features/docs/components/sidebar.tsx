import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { getVisibleVersions, getDocsVersion } from "@/app/features/docs/config";
import type { DocsTreeNode, DocsTree } from "@/app/features/docs/lib/types";
import type { DocsSuiteId } from "@/app/features/docs/config";

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
  currentVersion: string;
}) {
  const versions = getVisibleVersions(suiteId);

  if (versions.length <= 1) return null;

  return (
    <div className="mb-4">
      <select
        value={currentVersion}
        onChange={(e) => {
          const url = getDocsHomepageUrl(suiteId, e.target.value);
          window.history.pushState({}, "", url);
          window.dispatchEvent(new Event("sbm:navigate"));
        }}
        className={cn(
          "h-8 w-full appearance-none rounded-md border border-border/50 bg-muted/30",
          "px-2.5 text-xs font-medium text-foreground outline-none transition-colors",
          "hover:border-border focus-visible:ring-2 focus-visible:ring-ring/60",
        )}
        aria-label="Select documentation version"
      >
        {versions.map((v) => {
          const versionConfig = getDocsVersion(suiteId, v.value);
          const suffix = versionConfig?.status === "deprecated" ? " (deprecated)" : "";
          return (
            <option key={v.value} value={v.value}>
              {v.label}{suffix}
            </option>
          );
        })}
      </select>
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
  currentVersion: string;
  currentSlug: string | null;
}) {
  const treeKey = `${suiteId}:${currentVersion}`;
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

  if (sidebarHidden) {
    return (
      <div className="hidden lg:block">
        <button
          type="button"
          onClick={toggleSidebar}
          className="fixed left-4 top-20 z-30 flex size-8 items-center justify-center rounded-md border border-border/50 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav
        className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain pr-2 pb-8 scrollbar-thin"
        aria-label="Documentation navigation"
      >
        <div className="flex items-center justify-between mb-3">
          <Link
            to={getDocsHomepageUrl(suiteId, currentVersion)}
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Documentation
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
  currentVersion: string;
  currentSlug: string | null;
}) {
  const [open, setOpen] = useState(false);
  const treeKey = `${suiteId}:${currentVersion}`;
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
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-background border-r border-border/50 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <Link
                to={getDocsHomepageUrl(suiteId, currentVersion)}
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Documentation
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
        </>
      )}
    </div>
  );
}
