import { useMemo } from "react";
import { cn } from "@/app/lib/utils";
import { resolveIcon, getDocsTree, getVisibleNodes } from "@/app/features/docs/lib";
import type { DocsSuiteId } from "@/app/config/docs";
import type { DocsTreeNode } from "@/app/features/docs/lib";
import { Link } from "@/app/lib/router";
import { useDocsRoute } from "./docs-route-context";

type DirectoryProps = {
  /**
   * Folder slug to list children for. Defaults to the current page's slug, so
   * `<Directory />` on a landing page shows that page's child docs.
   * Pass `"/"` to list the suite's top-level visible nodes.
   */
  path?: string;
  /** Optional overrides — normally inferred from the surrounding doc route. */
  suiteId?: DocsSuiteId;
  version?: string | null;
};

export function Directory({ path, suiteId, version }: DirectoryProps) {
  const route = useDocsRoute();
  const resolvedSuiteId = suiteId ?? route?.suiteId;
  const resolvedVersion = version !== undefined ? version : (route?.version ?? null);
  const resolvedPath = path ?? route?.slug ?? "/";

  const tree = useMemo(
    () => (resolvedSuiteId ? getDocsTree(resolvedSuiteId, resolvedVersion) : null),
    [resolvedSuiteId, resolvedVersion],
  );

  const targetNodes = useMemo(() => {
    if (!tree) return [];
    if (resolvedPath === "/" || resolvedPath === "") {
      return getVisibleNodes(tree.nodes);
    }

    const cleanPath = resolvedPath.replace(/^\//, "");
    function findNodes(nodes: DocsTreeNode[]): DocsTreeNode[] {
      for (const node of nodes) {
        if (node.slug === cleanPath) {
          return getVisibleNodes(node.children);
        }
        const found = findNodes(node.children);
        if (found.length > 0) return found;
      }
      return [];
    }

    return findNodes(tree.nodes);
  }, [tree, resolvedPath]);

  if (targetNodes.length === 0) return null;

  return (
    <div className="my-6 grid gap-3 sm:grid-cols-2">
      {targetNodes.map((node) => (
        <DirectoryCard key={node.slug} node={node} />
      ))}
    </div>
  );
}

function DirectoryCard({ node }: { node: DocsTreeNode }) {
  const Icon = resolveIcon(node.frontmatter.icon);

  return (
    <Link
      to={node.routePath}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-border/50 p-4",
        "bg-card/50 backdrop-blur-sm transition-all duration-200",
        "hover:border-[var(--suite-accent-light)]/40 dark:hover:border-[var(--suite-accent-dark)]/40",
        "hover:bg-card/80 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          "bg-[var(--suite-accent-light)]/10 dark:bg-[var(--suite-accent-dark)]/10",
          "text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]",
          "transition-colors group-hover:bg-[var(--suite-accent-light)]/15 dark:group-hover:bg-[var(--suite-accent-dark)]/15",
        )}
      >
        <Icon className="size-4" aria-hidden={true} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm text-foreground group-hover:text-[var(--suite-accent-light)] dark:group-hover:text-[var(--suite-accent-dark)] transition-colors">
          {node.frontmatter.title}
        </div>
        {node.frontmatter.description && (
          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {node.frontmatter.description}
          </div>
        )}
      </div>
    </Link>
  );
}
