import { useMemo, useState } from "react";
import { NavDropdown, SuiteStatusChip } from "@subway-builder-modded/shared-ui";
import { cn } from "@/app/lib/utils";
import { getDocsHomepageUrl, getVersionSwitchUrl } from "@/app/features/docs/lib/routing";
import { getVisibleVersions, type DocsSuiteId } from "@/app/config/docs";

type DocsVersionChooserProps = {
  suiteId: DocsSuiteId;
  currentVersion: string;
  docSlug?: string | null;
  homepageMode?: boolean;
  className?: string;
  triggerClassName?: string;
  triggerLabel?: string;
};

const DEFAULT_TRIGGER_CLASS =
  "inline-flex h-9 min-w-[12rem] items-center justify-between rounded-lg border border-[color-mix(in_srgb,var(--option-color)_28%,var(--border))] bg-background/92 px-3 text-sm font-semibold text-foreground shadow-[0_8px_18px_-14px_rgba(0,0,0,0.3)]";

const MENU_CLASS = "rounded-xl border border-border bg-background p-1 shadow-lg";

export function DocsVersionChooser({
  suiteId,
  currentVersion,
  docSlug = null,
  homepageMode = false,
  className,
  triggerClassName,
  triggerLabel = "Choose documentation version",
}: DocsVersionChooserProps) {
  const [open, setOpen] = useState(false);
  const versions = getVisibleVersions(suiteId);

  const options = useMemo(
    () =>
      versions.map((item) => {
        const deprecatedTone = item.status === "deprecated";
        return {
          id: item.value,
          label: item.label,
          icon:
            item.status === "latest" ? (
              <SuiteStatusChip status="latest" size="sm" />
            ) : item.status === "deprecated" ? (
              <SuiteStatusChip status="deprecated" deprecatedTone="gray" size="sm" />
            ) : undefined,
          iconClassName: "inline-flex items-center",
          tone: deprecatedTone
            ? {
                color: "hsl(var(--muted-foreground))",
                muted: "hsl(var(--muted))",
              }
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
        const url = homepageMode
          ? getDocsHomepageUrl(suiteId, version)
          : getVersionSwitchUrl(suiteId, version, docSlug);

        window.history.pushState({}, "", url);
        window.dispatchEvent(new Event("sbm:navigate"));
      }}
    />
  );
}
