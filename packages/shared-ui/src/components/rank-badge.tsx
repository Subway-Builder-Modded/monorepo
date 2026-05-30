import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type RankBadgeTone = "neutral" | "gold" | "silver" | "bronze";

export type RankBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  rank: number | null;
};

function resolveTone(rank: number | null): RankBadgeTone {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "neutral";
}

const TONE_CLASS: Record<RankBadgeTone, string> = {
  neutral:
    "border-[color-mix(in_srgb,var(--border)_85%,transparent)] bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] text-muted-foreground",
  gold:
    "border-[color-mix(in_srgb,#f59e0b_72%,var(--border))] bg-[color-mix(in_srgb,#f59e0b_20%,transparent)] text-[color-mix(in_srgb,#f59e0b_82%,var(--foreground))]",
  silver:
    "border-[color-mix(in_srgb,#94a3b8_70%,var(--border))] bg-[color-mix(in_srgb,#94a3b8_18%,transparent)] text-[color-mix(in_srgb,#94a3b8_85%,var(--foreground))]",
  bronze:
    "border-[color-mix(in_srgb,#b45309_70%,var(--border))] bg-[color-mix(in_srgb,#b45309_18%,transparent)] text-[color-mix(in_srgb,#b45309_86%,var(--foreground))]",
};

export function RankBadge({ rank, className, ...props }: RankBadgeProps) {
  const tone = resolveTone(rank);
  const value = typeof rank === "number" && Number.isFinite(rank) ? String(rank) : "\u2014";

  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border text-sm font-semibold tabular-nums",
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {value}
    </span>
  );
}
