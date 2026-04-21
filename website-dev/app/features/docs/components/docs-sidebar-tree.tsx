import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getVisibleNodes } from "@/app/features/docs/lib/content";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { Link } from "@/app/lib/router";
import type { DocsTreeNode } from "@/app/features/docs/lib/types";

export function sidebarNodeHasActiveDescendant(
  node: DocsTreeNode,
  currentSlug: string | null,
): boolean {
  for (const child of getVisibleNodes(node.children)) {
    if (child.slug === currentSlug) {
      return true;
    }
    if (sidebarNodeHasActiveDescendant(child, currentSlug)) {
      return true;
    }
  }
  return false;
}

export function nodeIsActiveInMiniRail(node: DocsTreeNode, currentSlug: string | null): boolean {
  if (node.slug === currentSlug) {
    return true;
  }
  return sidebarNodeHasActiveDescendant(node, currentSlug);
}

export function DocsSidebarTree({
  nodes,
  currentSlug,
  collapsed,
  onToggle,
}: {
  nodes: DocsTreeNode[];
  currentSlug: string | null;
  collapsed: Set<string>;
  onToggle: (slug: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <SidebarItem
          key={node.slug}
          node={node}
          currentSlug={currentSlug}
          collapsed={collapsed}
          onToggle={onToggle}
        />
      ))}
    </ul>
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
  const hasActiveDescendant = hasChildren && sidebarNodeHasActiveDescendant(node, currentSlug);
  const isRowActive = isSelfActive || (isCollapsed && hasActiveDescendant);
  const Icon = resolveIcon(node.frontmatter.icon);

  return (
    <li>
      <div
        className={cn(
          "group/row rounded-lg border border-transparent transition-colors",
          isRowActive
            ? "border-[color-mix(in_srgb,var(--suite-accent-light)_34%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)]"
            : "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]",
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
                : "text-foreground/75 group-hover/row:text-[var(--suite-accent-light)] dark:group-hover/row:text-[var(--suite-accent-dark)]",
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
                  : "text-muted-foreground group-hover/row:text-[var(--suite-accent-light)] dark:group-hover/row:text-[var(--suite-accent-dark)]",
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
          <ul className="space-y-1 overflow-hidden border-l border-border/35 pl-2.5">
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
