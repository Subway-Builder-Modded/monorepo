import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

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
