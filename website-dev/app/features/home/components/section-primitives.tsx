import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

type HomeSectionHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  accentColor?: string;
};

export function HomeSectionHeader({
  kicker,
  title,
  description,
  accentColor,
}: HomeSectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="h-0.5 w-5 rounded-full"
          style={{
            backgroundColor: accentColor ?? "currentColor",
            opacity: accentColor ? 1 : 0.35,
          }}
          aria-hidden="true"
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {kicker}
        </span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        {description}
      </p>
    </div>
  );
}

type TransitActionPanelProps = {
  accentColor?: string;
  children: ReactNode;
  className?: string;
};

export function TransitActionPanel({ accentColor, children, className }: TransitActionPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-card/80",
        className,
      )}
    >
      {/* Top accent rail */}
      {accentColor && (
        <div
          className="h-[3px] w-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

type DestinationRowProps = {
  children: ReactNode;
  className?: string;
};

export function DestinationRow({ children, className }: DestinationRowProps) {
  return <div className={cn("flex flex-wrap items-center gap-2.5", className)}>{children}</div>;
}
