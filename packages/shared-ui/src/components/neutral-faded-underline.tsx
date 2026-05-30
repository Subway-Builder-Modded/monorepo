import { cn } from "../lib/cn";

type NeutralFadedUnderlineProps = {
  className?: string;
};

export function NeutralFadedUnderline({ className }: NeutralFadedUnderlineProps) {
  return (
    <span
      aria-hidden={true}
      className={cn(
        "block h-px w-full bg-[linear-gradient(90deg,transparent_0%,color-mix(in_srgb,var(--foreground)_34%,transparent)_18%,color-mix(in_srgb,var(--foreground)_58%,transparent)_50%,color-mix(in_srgb,var(--foreground)_34%,transparent)_82%,transparent_100%)]",
        className,
      )}
    />
  );
}
