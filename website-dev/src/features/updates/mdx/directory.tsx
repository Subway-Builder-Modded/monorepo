import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpdatesSuiteId } from "@/config/updates";
import { resolveIcon } from "@/features/docs/lib/icon-resolver";
import { getUpdateDirectoryEntries } from "@/features/updates/lib/content";
import { formatUpdateDisplayId } from "@/features/updates/lib/formatting";
import { getUpdatePageUrl } from "@/features/updates/lib/routing";
import { Link } from "@/lib/router";
import { LatestReleaseChip, TagChip } from "@/features/updates/components/tag-badges";
import { useUpdatesRoute } from "./updates-route-context";
import { DirectoryShell } from "@/features/content/components/directory-shell";

type DirectoryProps = {
  path?: string;
  suiteId?: UpdatesSuiteId;
  icon?: string;
  label?: string;
  emptyLabel?: string;
};

export function Directory({ path, suiteId, icon, label, emptyLabel }: DirectoryProps) {
  const route = useUpdatesRoute();
  const resolvedSuiteId = suiteId ?? route?.suiteId;
  const resolvedPath = path ?? route?.slug ?? "/";

  const entries = useMemo(() => {
    if (!resolvedSuiteId) return [];

    const folder = resolvedPath === "/" ? "" : resolvedPath.replace(/^\/+|\/+$/g, "");
    return getUpdateDirectoryEntries(resolvedSuiteId, folder);
  }, [resolvedPath, resolvedSuiteId]);

  const latestId = entries[0]?.id ?? null;
  const SeparatorIcon = icon ? resolveIcon(icon) : undefined;

  return (
    <DirectoryShell
      icon={SeparatorIcon}
      label={label}
      isEmpty={entries.length === 0}
      emptyLabel={emptyLabel}
    >
      <div className="space-y-2">
        {entries.map((entry) => {
          const Icon = resolveIcon(entry.frontmatter.icon);
          const isLatest = latestId === entry.id;

          return (
            <Link
              key={entry.id}
              to={getUpdatePageUrl(entry.suiteId, entry.id)}
              className={cn(
                "group block rounded-xl border-2 border-border/60 bg-background/70 transition-all",
                "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_7%,transparent)]",
                "dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_10%,transparent)]",
              )}
            >
              <div className="flex items-start gap-3 rounded-[0.7rem] px-3.5 py-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--suite-accent-light)] opacity-80 transition-opacity group-hover:opacity-95 dark:text-[var(--suite-accent-dark)]">
                  <Icon className="size-5" aria-hidden={true} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-base font-bold leading-tight text-foreground">
                      {entry.frontmatter.title}
                    </p>
                    <TagChip tag={entry.frontmatter.tag} />
                    {isLatest ? <LatestReleaseChip /> : null}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>
                      {formatUpdateDisplayId(entry.id)} • {entry.frontmatter.date}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-60"
                  aria-hidden="true"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </DirectoryShell>
  );
}
