import { useMemo, useState } from "react";
import { NavDropdown, SuiteStatusChip } from "@subway-builder-modded/shared-ui";
import { cn } from "@/app/lib/utils";
import { getDocsHomepageUrl, getDocPageUrl } from "@/app/features/docs/lib/routing";
import { getVisibleVersions, type DocsSuiteId } from "@/app/config/docs";

type DocsVersionChooserProps = {
  suiteId: DocsSuiteId;
  currentVersion: string;
  docSlug?: string | null;
  className?: string;
  triggerClassName?: string;
  triggerLabel?: string;
};

type VersionTarget = "homepage" | "doc";

const DEFAULT_TRIGGER_CLASS =
  "inline-flex h-9 min-w-[12rem] items-center justify-between rounded-lg border border-[color-mix(in_srgb,var(--suite-accent-light)_35%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] px-3 text-sm font-semibold text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_16%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_20%,transparent)]";

const MENU_CLASS =
  "rounded-xl border border-border/70 bg-background p-1 shadow-lg";

export function DocsVersionChooser({
  suiteId,
  currentVersion,
  docSlug = null,
  className,
  triggerClassName,
  triggerLabel = "Choose documentation version",
}: DocsVersionChooserProps) {
  const [open, setOpen] = useState(false);
  const versions = getVisibleVersions(suiteId);

  const options = useMemo(
    () =>
      versions.map((item) => {
        const mutedTone = item.status === "deprecated";
        return {
          id: item.value,
          label: item.label,
          icon:
            item.status === "latest" ? (
              <SuiteStatusChip status="latest" size="sm" />
            ) : item.status === "deprecated" ? (
              <SuiteStatusChip status="deprecated" deprecatedTone="gray" size="sm" />
            ) : undefined,
          tone: mutedTone
            ? undefined
            : {
                color: "var(--suite-accent-light)",
                muted: "color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)",
              },
        };
      }),
    [versions],
  );

  if (versions.length <= 1) {
    return null;
  }

  const target: VersionTarget = docSlug ? "doc" : "homepage";

  return (
    <NavDropdown
      className={className}
      options={options}
      selectedId={currentVersion}
      isOpen={open}
      onOpenChange={setOpen}
      triggerLabel={triggerLabel}
      triggerClassName={cn(DEFAULT_TRIGGER_CLASS, triggerClassName)}
      menuClassName={MENU_CLASS}
      onSelect={(version) => {
        const url =
          target === "doc" && docSlug
            ? getDocPageUrl(suiteId, version, docSlug)
            : getDocsHomepageUrl(suiteId, version);

        window.history.pushState({}, "", url);
        window.dispatchEvent(new Event("sbm:navigate"));
      }}
    />
  );
}
