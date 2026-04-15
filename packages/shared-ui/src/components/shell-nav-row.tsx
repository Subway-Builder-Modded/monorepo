import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

type ShellNavRowProps = {
  title: string;
  description: string;
  icon: ReactNode;
  active?: boolean;
  className?: string;
};

/**
 * Station-board style navigation row for shell panels.
 *
 * Expects `--suite-accent` and `--suite-accent-contrast` CSS custom properties
 * to be set on an ancestor element.
 *
 * Active row: filled suite accent with high-contrast text.
 * Inactive row: transparent background, subtle tinted hover.
 */
export function ShellNavRow({
  title,
  description,
  icon,
  active = false,
  className,
}: ShellNavRowProps) {
  return (
    <div
      className={cn(
        "group flex min-h-[3.25rem] items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        active
          ? "bg-[color:var(--suite-accent)] text-[color:var(--suite-accent-contrast)]"
          : "text-foreground hover:bg-[color:color-mix(in_srgb,var(--suite-accent)_10%,transparent)]",
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0 [&_svg]:size-5",
          active ? "opacity-90" : "text-[color:var(--suite-accent)] opacity-80",
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold leading-tight",
            !active && "text-foreground",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-xs leading-relaxed",
            active ? "opacity-75" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      </div>

      <ChevronRight
        className={cn(
          "size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
          active ? "opacity-60" : "text-muted-foreground opacity-40",
        )}
        aria-hidden="true"
      />
    </div>
  );
}
