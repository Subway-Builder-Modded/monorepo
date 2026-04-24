import { useMemo } from "react";
import { DirectoryCard } from "@subway-builder-modded/shared-ui";
import { resolveIcon, getDocsTree, getVisibleNodes } from "@/features/docs/lib";
import type { DocsSuiteId } from "@/config/docs";
import { Link } from "@/lib/router";
import { useDocsRoute } from "./docs-route-context";
import { DirectoryShell } from "@/features/content/components/directory-shell";

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
  /** Lucide icon name to show in the separator, e.g. `"Compass"`. */
  icon?: string;
  /** Label text to show in the separator. */
  label?: string;
};

export function DocsDirectory({ path, suiteId, version, icon, label }: DirectoryProps) {
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

  const SeparatorIcon = icon ? resolveIcon(icon) : undefined;

  return (
    <DirectoryShell icon={SeparatorIcon} label={label} className="my-6">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {targetNodes.map((node) => {
          const Icon = resolveIcon(node.frontmatter.icon);
          return (
            <DirectoryCard
              key={node.slug}
              asChild
              icon={<Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />}
              heading={node.frontmatter.title}
              description={node.frontmatter.description}
            >
              <Link to={node.routePath}>{null}</Link>
            </DirectoryCard>
          );
        })}
      </div>
    </DirectoryShell>
  );
}

export const Directory = DocsDirectory;
