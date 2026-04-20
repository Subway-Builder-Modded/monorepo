import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react";
import { SuiteBadge, SuiteStatusChip } from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { getVisibleVersions, isVersionedDocsSuite, type DocsRouteVersion } from "@/app/config/docs";
import { getSuiteById } from "@/app/config/site-navigation";
import type { DocsTreeNode, DocsTree } from "@/app/features/docs/lib/types";
import type { DocsSuiteId } from "@/app/config/docs";

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

function nodeHasActiveDescendant(node: DocsTreeNode, currentSlug: string | null): boolean {
  for (const child of getVisibleNodes(node.children)) {
    if (child.slug === currentSlug) {
      return true;
    }
    if (nodeHasActiveDescendant(child, currentSlug)) {
      return true;
    }
  }
  return false;
}

function nodeIsActiveInMiniRail(node: DocsTreeNode, currentSlug: string | null): boolean {
  if (node.slug === currentSlug) {
    return true;
  }
  return nodeHasActiveDescendant(node, currentSlug);
}

function VersionDropdown({
  suiteId,
  currentVersion,
}: {
  suiteId: DocsSuiteId;
  currentVersion: string;
}) {
  const versions = getVisibleVersions(suiteId);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (versions.length <= 1) {
    return null;
  }

  const selected = versions.find((item) => item.value === currentVersion) ?? versions[0];
  const selectedDeprecated = selected.status === "deprecated";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm font-semibold transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selectedDeprecated
            ? "border-border/70 bg-muted/35 text-muted-foreground hover:bg-muted/50"
            : "border-[color-mix(in_srgb,var(--suite-accent-light)_35%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_16%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_20%,transparent)]",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <span>{selected.label}</span>
          {selected.status === "latest" ? <SuiteStatusChip status="latest" size="sm" /> : null}
          {selected.status === "deprecated" ? (
            <SuiteStatusChip status="deprecated" deprecatedTone="gray" size="sm" />
          ) : null}
        </span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Documentation versions"
          className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-border/70 bg-background p-1 shadow-lg"
        >
          {versions.map((item) => {
            const selectedItem = item.value === currentVersion;
            const deprecated = item.status === "deprecated";
            return (
              <li key={item.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedItem}
                  onClick={() => {
                    const url = getDocsHomepageUrl(suiteId, item.value);
                    setOpen(false);
                    window.history.pushState({}, "", url);
                    window.dispatchEvent(new Event("sbm:navigate"));
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    deprecated
                      ? "text-muted-foreground hover:bg-muted/50"
                      : "text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]",
                    selectedItem &&
                      (deprecated
                        ? "bg-muted/45"
                        : "bg-[color-mix(in_srgb,var(--suite-accent-light)_16%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_20%,transparent)]"),
                  )}
                >
                  <span>{item.label}</span>
                  {item.status === "latest" ? <SuiteStatusChip status="latest" size="sm" /> : null}
                  {item.status === "deprecated" ? (
                    <SuiteStatusChip status="deprecated" deprecatedTone="gray" size="sm" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function SidebarItem({
  node,
  currentSlug,
  collapsed,
  onToggle,
  depth = 0,
}: {
  node: DocsTreeNode;
  currentSlug: string | null;
  collapsed: Set<string>;
  onToggle: (slug: string) => void;
  depth?: number;
}) {
  const visibleChildren = getVisibleNodes(node.children);
  const hasChildren = visibleChildren.length > 0;
  const isCollapsed = collapsed.has(node.slug);
  const isSelfActive = currentSlug === node.slug;
  const hasActiveDescendant = hasChildren && nodeHasActiveDescendant(node, currentSlug);
  const isRowActive = isSelfActive || (isCollapsed && hasActiveDescendant);
  const Icon = resolveIcon(node.frontmatter.icon);

  return (
    <li>
      <div
        className={cn(
          "group/row rounded-lg border border-transparent transition-colors",
          isRowActive
            ? "border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]"
            : "hover:border-border/60 hover:bg-muted/45",
        )}
      >
        <div className="flex min-w-0 items-center">
          <Link
            to={node.routePath}
            aria-current={isSelfActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] leading-snug transition-colors",
              isRowActive
                ? "text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                : "text-foreground/75 group-hover/row:text-foreground",
            )}
            style={{ paddingLeft: `${0.6 + depth * 0.65}rem` }}
          >
            <Icon className="size-3.5 shrink-0 opacity-75" aria-hidden={true} />
            <span className="truncate font-medium">{node.frontmatter.title}</span>
          </Link>

          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(node.slug)}
              className={cn(
                "mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                isRowActive
                  ? "text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                  : "text-muted-foreground group-hover/row:text-foreground",
              )}
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {hasChildren ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out",
            isCollapsed ? "mt-0 grid-rows-[0fr] opacity-0" : "mt-1 grid-rows-[1fr] opacity-100",
          )}
        >
          <ul className="overflow-hidden border-l border-border/35 pl-2.5 space-y-1">
            {visibleChildren.map((child) => (
              <SidebarItem
                key={child.slug}
                node={child}
                currentSlug={currentSlug}
                collapsed={collapsed}
                onToggle={onToggle}
                depth={depth + 1}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
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

      <button
        type="button"
        onClick={onExpand}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] text-[var(--suite-accent-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]"
        aria-label="Expand sidebar"
      >
        <PanelLeftOpen className="size-4" />
      </button>

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
                  <button
                    type="button"
                    onClick={() => setCollapsedState(true)}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] text-[var(--suite-accent-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="size-4" />
                  </button>
                </div>

                {isVersionedDocsSuite(suiteId) && currentVersion ? (
                  <VersionDropdown suiteId={suiteId} currentVersion={currentVersion} />
                ) : null}
              </div>

              <nav
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 scrollbar-thin"
                aria-label="Documentation navigation"
              >
                <ul className="space-y-1">
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] px-3 text-xs font-semibold text-[var(--suite-accent-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)]"
        aria-label="Open navigation menu"
      >
        <Menu className="size-3.5" />
        Documentation Menu
      </button>

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
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] text-[var(--suite-accent-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]"
                    aria-label="Close navigation menu"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {isVersionedDocsSuite(suiteId) && currentVersion ? (
                  <VersionDropdown suiteId={suiteId} currentVersion={currentVersion} />
                ) : null}
              </div>

              <nav
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 scrollbar-thin"
                aria-label="Documentation navigation"
              >
                <ul className="space-y-1">
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
        </>
      ) : null}
    </div>
  );
}
