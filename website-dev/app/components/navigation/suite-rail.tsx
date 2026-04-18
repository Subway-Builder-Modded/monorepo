import type { ReactNode } from "react";
import type { SiteSuiteId } from "@/app/config/site-navigation";
import { cn } from "@/app/lib/utils";

export type SuiteRailItem = {
  id: SiteSuiteId;
  title: string;
  icon: ReactNode;
  accentColor: string;
  mutedColor: string;
};

type SuiteRailProps = {
  items: SuiteRailItem[];
  selectedId: SiteSuiteId;
  onSelect: (id: SiteSuiteId) => void;
};

export function SuiteRail({ items, selectedId, onSelect }: SuiteRailProps) {
  return (
    <nav aria-label="Suite categories" className="flex flex-col gap-1 py-1">
      {items.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <button
            key={item.id}
            type="button"
            aria-current={isSelected ? "true" : undefined}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected ? "font-semibold" : "hover:bg-foreground/[0.04] dark:hover:bg-muted/30",
            )}
            style={{
              color: item.accentColor,
              backgroundColor: isSelected ? item.mutedColor : undefined,
            }}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="whitespace-nowrap">{item.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
