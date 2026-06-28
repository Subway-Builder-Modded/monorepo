import type { ComponentType, ReactNode } from "react";

type DirectoryShellProps = {
  /**
   * Pre-resolved icon component to show in the separator row.
   * Each feature resolves its icon string to a component before passing it here
   * so this shell has no dependency on any icon-resolver.
   */
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Label text shown beside the icon in the separator row. */
  label?: string;
  /** Message shown when `isEmpty` is true. */
  emptyLabel?: string;
  /** Render the empty-state message instead of children. */
  isEmpty?: boolean;
  /** Extra className on the root wrapper element. */
  className?: string;
  /**
   * The feature's item list, already wrapped in its own container
   * (e.g. `<div className="grid …">` for docs, `<div className="space-y-2">` for updates).
   * Only rendered when `isEmpty` is false.
   */
  children?: ReactNode;
};

/**
 * Shared structural shell for directory components.
 *
 * Renders:
 * - an optional separator row (icon + label + horizontal rule)
 * - either an empty-state paragraph or the passed `children`
 *
 * Layout concerns (grid vs list, outer spacing) remain the responsibility
 * of each feature component so styling can evolve independently.
 */
export function DirectoryShell({
  icon: Icon,
  label,
  emptyLabel = "No entries available.",
  isEmpty = false,
  className,
  children,
}: DirectoryShellProps) {
  const hasSeparator = Icon != null || label != null;

  return (
    <div className={className}>
      {hasSeparator ? (
        <div className="mb-4 flex items-center gap-2.5" aria-hidden="true">
          {Icon ? (
            <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden={true} />
          ) : null}
          {label ? (
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </span>
          ) : null}
          <div className="h-px flex-1 bg-border/60" />
        </div>
      ) : null}

      {isEmpty ? <p className="text-sm text-muted-foreground">{emptyLabel}</p> : children}
    </div>
  );
}
