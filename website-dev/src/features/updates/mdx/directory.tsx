import { useMemo } from "react";
import { DirectoryCard } from "@subway-builder-modded/shared-ui";
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
            <DirectoryCard
              key={entry.id}
              asChild
              icon={<Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />}
              heading={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-base font-bold leading-tight text-foreground">
                    {entry.frontmatter.title}
                  </span>
                  <TagChip tag={entry.frontmatter.tag} />
                  {isLatest ? <LatestReleaseChip /> : null}
                </span>
              }
              description={`${formatUpdateDisplayId(entry.id)} • ${entry.frontmatter.date}`}
              descriptionClassName="text-xs"
            >
              <Link to={getUpdatePageUrl(entry.suiteId, entry.id)}>{null}</Link>
            </DirectoryCard>
          );
        })}
      </div>
    </DirectoryShell>
  );
}
