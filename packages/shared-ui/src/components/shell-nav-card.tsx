import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type ShellNavCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  active?: boolean;
  className?: string;
};

export function ShellNavCard({
  title,
  description,
  icon,
  active = false,
  className,
}: ShellNavCardProps) {
  return (
    <article
      className={cn(
        "group rounded-xl border-2 bg-background px-3 py-2.5 transition-colors duration-200",
        "border-[color:color-mix(in_srgb,var(--suite-accent)_76%,var(--border))]",
        "text-foreground hover:bg-[color:var(--suite-accent)] hover:text-[color:var(--suite-accent-contrast)]",
        "focus-within:bg-[color:var(--suite-accent)] focus-within:text-[color:var(--suite-accent-contrast)]",
        active && "bg-[color:var(--suite-accent)] text-[color:var(--suite-accent-contrast)]",
        className,
      )}
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-2.5">
        <div className="text-current [&_svg]:size-6">{icon}</div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold leading-tight">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed opacity-85">{description}</p>
        </div>
      </div>
    </article>
  );
}
