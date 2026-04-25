import { useMemo } from "react";
import type { UpdatesSuiteId } from "@/config/updates";
import { getUpdateDirectoryEntries } from "@/features/updates/lib/content";
import { UpdateEntryCard } from "@/features/updates/components/update-entry-card";
import { useUpdatesRoute } from "./updates-route-context";
import { DirectoryShell } from "@/features/content/components/directory-shell";
import { resolveIcon } from "@/features/docs/lib/icon-resolver";

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
          const isLatest = latestId === entry.id;

          return <UpdateEntryCard key={entry.id} entry={entry} isLatest={isLatest} />;
        })}
      </div>
    </DirectoryShell>
  );
}
