import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getVisibleNodes } from "@/features/docs/lib/content";
import { resolveIcon } from "@subway-builder-modded/icons";
import { Link } from "@/lib/router";
import type { DocsTreeNode } from "@/features/docs/lib/types";

type SidebarRenderNode = {
  node: DocsTreeNode;
  depth: number;
  children: SidebarRenderNode[];
  hasChildren: boolean;
  isCollapsed: boolean;
  isSelfActive: boolean;
  hasActiveDescendant: boolean;
  isRowActive: boolean;
  Icon: ReturnType<typeof resolveIcon>;
};

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

function buildSidebarRenderNodes(
  nodes: DocsTreeNode[],
  currentSlug: string | null,
  collapsed: Set<string>,
  depth = 0,
): SidebarRenderNode[] {
  const visibleNodes = getVisibleNodes(nodes);

  return visibleNodes.map((node) => {
    const children = buildSidebarRenderNodes(node.children, currentSlug, collapsed, depth + 1);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsed.has(node.slug);
    const isSelfActive = currentSlug === node.slug;
    const hasActiveDescendant =
      hasChildren && children.some((child) => child.isSelfActive || child.hasActiveDescendant);

    return {
      node,
      depth,
      children,
      hasChildren,
      isCollapsed,
      isSelfActive,
      hasActiveDescendant,
      isRowActive: isSelfActive || (isCollapsed && hasActiveDescendant),
      Icon: resolveIcon(node.frontmatter.icon),
    };
  });
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
  const renderedNodes = useMemo(
    () => buildSidebarRenderNodes(nodes, currentSlug, collapsed),
    [nodes, currentSlug, collapsed],
  );

  return (
    <ul className="space-y-1">
      {renderedNodes.map((node) => (
        <SidebarItem key={node.node.slug} node={node} onToggle={onToggle} />
      ))}
    </ul>
  );
}

function SidebarItem({
  node,
  onToggle,
}: {
  node: SidebarRenderNode;
  onToggle: (slug: string) => void;
}) {
  const { node: currentNode } = node;

  return (
    <li>
      <div
        className={cn(
          "group/row rounded-lg border border-transparent transition-colors",
          node.isRowActive
            ? "border-[color-mix(in_srgb,var(--suite-accent-light)_34%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)]"
            : "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]",
        )}
      >
        <div className="flex min-w-0 items-center">
          <Link
            to={currentNode.routePath}
            aria-current={node.isSelfActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] leading-snug transition-colors",
              node.isRowActive
                ? "text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                : "text-foreground/75 group-hover/row:text-[var(--suite-accent-light)] dark:group-hover/row:text-[var(--suite-accent-dark)]",
            )}
            style={{ paddingLeft: `${0.6 + node.depth * 0.65}rem` }}
          >
            <node.Icon className="size-3.5 shrink-0 opacity-75" aria-hidden={true} />
            <span className="truncate font-medium">{currentNode.frontmatter.title}</span>
          </Link>

          {node.hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(currentNode.slug)}
              className={cn(
                "mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                node.isRowActive
                  ? "text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                  : "text-muted-foreground group-hover/row:text-[var(--suite-accent-light)] dark:group-hover/row:text-[var(--suite-accent-dark)]",
              )}
              aria-expanded={!node.isCollapsed}
            >
              <ChevronRight
                className={cn(
                  "size-3.5 transition-transform duration-200 ease-out",
                  !node.isCollapsed && "rotate-90",
                )}
              />
            </button>
          ) : null}
        </div>
      </div>

      {node.hasChildren ? (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out",
            node.isCollapsed
              ? "mt-0 grid-rows-[0fr] opacity-0"
              : "mt-1 grid-rows-[1fr] opacity-100",
          )}
        >
          <ul className="space-y-1 overflow-hidden border-l border-border/35 pl-2.5">
            {node.children.map((child) => (
              <SidebarItem key={child.node.slug} node={child} onToggle={onToggle} />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}
