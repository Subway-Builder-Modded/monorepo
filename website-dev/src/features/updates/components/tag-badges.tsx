import { cn } from "@/lib/utils";
import { UPDATES_TAG_PRESENTATION, type UpdatesTag } from "@/config/updates";

type BadgeSize = "default" | "title";

type TagChipProps = {
  tag: UpdatesTag;
  size?: BadgeSize;
};

export function TagChip({ tag, size = "default" }: TagChipProps) {
  const presentation = UPDATES_TAG_PRESENTATION[tag];

  return (
    <span
      className={cn(
        "inline-flex rounded-md font-semibold",
        size === "title"
          ? "px-2.5 py-1 text-sm leading-none sm:px-3 sm:py-1.5 sm:text-base"
          : "px-2 py-0.5 text-[11px]",
        presentation.toneClassName,
      )}
    >
      {presentation.label}
    </span>
  );
}

export function LatestReleaseChip({ size = "default" }: { size?: BadgeSize }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md bg-blue-500/14 font-semibold text-blue-700 dark:text-blue-300",
        size === "title"
          ? "px-2.5 py-1 text-sm leading-none sm:px-3 sm:py-1.5 sm:text-base"
          : "px-2 py-0.5 text-[11px]",
      )}
    >
      Latest
    </span>
  );
}
