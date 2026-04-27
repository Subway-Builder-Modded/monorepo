import { ReleaseStatusChip } from "@subway-builder-modded/shared-ui";
import { UPDATES_TAG_PRESENTATION, type UpdatesTag } from "@/config/updates";

type BadgeSize = "default" | "title";

type TagChipProps = {
  tag: UpdatesTag;
  size?: BadgeSize;
};

export function TagChip({ tag, size = "default" }: TagChipProps) {
  const presentation = UPDATES_TAG_PRESENTATION[tag];
  const status = tag === "alpha" ? "pre-release" : tag;

  return <ReleaseStatusChip status={status} size={size} label={presentation.label} />;
}

export function LatestReleaseChip({ size = "default" }: { size?: BadgeSize }) {
  return <ReleaseStatusChip status="latest" size={size} />;
}
