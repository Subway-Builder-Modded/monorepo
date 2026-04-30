import { useState } from "react";
import { FileCode2, FileText, Folder, FolderTree } from "lucide-react";
import type { TemplateModDirectoryNode } from "@/features/template-mod/template-mod-types";

type TemplateModDirectoryTreeProps = {
  tree: TemplateModDirectoryNode;
};

function findFirstLeaf(node: TemplateModDirectoryNode): TemplateModDirectoryNode {
  if (!node.children?.length) {
    return node;
  }

  return findFirstLeaf(node.children[0]!);
}

export function TemplateModDirectoryTree({ tree }: TemplateModDirectoryTreeProps) {
  const [hoveredId, setHoveredId] = useState(() => findFirstLeaf(tree).id);

  function renderNode(node: TemplateModDirectoryNode, depth = 0) {
    const isFolder = node.kind === "folder";
    const isHighlighted = hoveredId === node.id;
    const FileIcon = node.label.endsWith(".md") ? FileText : FileCode2;
    const Icon = isFolder ? Folder : FileIcon;

    return (
      <div key={node.id}>
        <div
          role="button"
          tabIndex={0}
          onMouseEnter={() => setHoveredId(node.id)}
          onFocus={() => setHoveredId(node.id)}
          className={[
            "group flex w-full items-center gap-2 rounded-lg border px-1.5 py-1.5 text-left transition-colors duration-200",
            isHighlighted
              ? "border-[color-mix(in_srgb,var(--suite-accent-light)_28%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_9%,white)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_30%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_10%,transparent)]"
              : "border-transparent bg-transparent",
          ].join(" ")}
        >
          <span className="relative flex w-full items-center gap-2" style={{ paddingLeft: `${depth * 1.45}rem` }}>
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <span className="pointer-events-none absolute -left-3 top-1/2 h-px w-3 -translate-y-1/2 bg-transparent" aria-hidden={true} />
            </span>

            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,white)] text-[var(--suite-accent-light)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_12%,transparent)] dark:text-[var(--suite-accent-dark)]">
              <Icon className="size-3.5" aria-hidden={true} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{node.label}</span>
            </span>
          </span>
        </div>

        {isFolder && node.children?.length ? (
          <div className="mt-1 space-y-1">
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border/55 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--suite-accent-light)_10%,white),transparent_38%),color-mix(in_srgb,var(--background)_88%,transparent)] shadow-[0_18px_48px_rgba(var(--elevation-shadow-rgb),0.14)]">
      <div className="border-b border-border/50 px-4 py-4 sm:px-5">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <FolderTree
            className="size-4.5 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
            aria-hidden={true}
          />
          Project Layout
        </h3>
      </div>

      <div className="p-3 sm:p-4">
        <div className="space-y-1">{renderNode(tree)}</div>
      </div>
    </div>
  );
}