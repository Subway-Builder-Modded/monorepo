import { useMemo } from "react";
import {
  VersionSwitcherDropdown,
  getSuiteAccentStyle,
} from "@subway-builder-modded/shared-ui";
import { cn } from "@/app/lib/utils";
import { getDocsHomepageUrl, getVersionSwitchUrl } from "@/app/features/docs/lib/routing";
import { getVisibleVersions, type DocsSuiteId } from "@/app/config/docs";
import { getSuiteById } from "@/app/config/site-navigation";

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
  "h-9 min-w-[12rem]";

export function DocsVersionChooser({
  suiteId,
  currentVersion,
  docSlug = null,
  homepageMode = false,
  className,
  triggerClassName,
  triggerLabel = "Choose documentation version",
}: DocsVersionChooserProps) {
  const versions = getVisibleVersions(suiteId);
  const suite = getSuiteById(suiteId);
  const accentStyle = useMemo(() => getSuiteAccentStyle(suite.accent), [suite.accent]);

  const options = useMemo(
    () =>
      versions.map((item) => ({
        id: item.value,
        label: item.label,
        status: item.status ?? "stable",
      })),
    [versions],
  );

  if (versions.length <= 1) {
    return null;
  }

  return (
    <VersionSwitcherDropdown
      className={className}
      items={options}
      selectedId={currentVersion}
      ariaLabel={triggerLabel}
      triggerClassName={cn(DEFAULT_TRIGGER_CLASS, triggerClassName)}
      style={accentStyle}
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
