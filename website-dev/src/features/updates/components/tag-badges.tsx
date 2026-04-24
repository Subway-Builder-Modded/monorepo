import { cn } from "@/lib/utils";
import type { UpdatesTag } from "@/config/updates";

type BadgeSize = "default" | "title";

type TagChipProps = {
  tag: UpdatesTag;
  size?: BadgeSize;
};

export function TagChip({ tag, size = "default" }: TagChipProps) {
  const tone =
    tag === "release"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      : tag === "beta"
        ? "bg-yellow-500/14 text-yellow-700 dark:text-yellow-300"
        : "bg-red-500/12 text-red-700 dark:text-red-300";

  const label =
    tag === "release" ? "Release" : tag === "beta" ? "Beta" : "Release-Candidate";

  return (
    <span
      className={cn(
        "inline-flex rounded-md font-semibold",
        size === "title"
          ? "px-2.5 py-1 text-sm leading-none sm:px-3 sm:py-1.5 sm:text-base"
          : "px-2 py-0.5 text-[11px]",
        tone,
      )}
    >
      {label}
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
