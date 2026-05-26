import { BarChart3, FileText, GalleryHorizontalEnd, History, Map } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@subway-builder-modded/shared-ui";
import type { ComponentType } from "react";

export type RegistryDetailTabId = "description" | "analytics" | "gallery" | "versions" | "map";

type RegistryDetailTabsProps = {
  value: RegistryDetailTabId;
  onValueChange: (next: RegistryDetailTabId) => void;
};

const TAB_ITEMS: Array<{
  id: RegistryDetailTabId;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}> = [
  { id: "description", label: "Description", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd },
  { id: "versions", label: "Versions", icon: History },
  { id: "map", label: "Map", icon: Map },
];

export function RegistryDetailTabs({ value, onValueChange }: RegistryDetailTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as RegistryDetailTabId)}>
      <TabsList
        variant="default"
        aria-label="Registry item detail tabs"
        className="grid w-full grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/25 p-2 group-data-[orientation=horizontal]/tabs:h-auto sm:grid-cols-5"
      >
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="h-10 rounded-lg border border-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent-strong)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_12%,var(--card))] hover:!text-[var(--registry-type-accent-strong)] dark:hover:!text-[var(--registry-type-accent-strong)] data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent-strong)_60%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_18%,var(--card))] data-[state=active]:font-semibold data-[state=active]:!text-[var(--registry-type-accent-strong)]"
            >
              <Icon className="size-4" aria-hidden={true} />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
