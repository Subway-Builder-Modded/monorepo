import { BarChart3, FileText, GalleryHorizontalEnd, History, Info, Map } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@subway-builder-modded/shared-ui";
import type { ComponentType } from "react";
import {
  getRegistryDetailTabsForType,
  type RegistryDetailTabId,
} from "@/features/registry/registry-type-ui";

type RegistryDetailTabsProps = {
  value: RegistryDetailTabId;
  typeId: string;
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
  { id: "details", label: "Details", icon: Info },
];

export function RegistryDetailTabs({ value, typeId, onValueChange }: RegistryDetailTabsProps) {
  const visibleTabIds = new Set(getRegistryDetailTabsForType(typeId));
  const visibleTabs = TAB_ITEMS.filter((tab) => visibleTabIds.has(tab.id));
  const showsMapTab = visibleTabIds.has("map");

  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as RegistryDetailTabId)}>
      <TabsList
        variant="default"
        aria-label="Registry item detail tabs"
        className={`grid w-full grid-cols-2 gap-1 rounded-xl border border-border/70 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:gap-2 sm:p-2 ${showsMapTab ? "sm:grid-cols-3 md:grid-cols-6" : "sm:grid-cols-3 md:grid-cols-5"}`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
        }}
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="h-10 min-w-0 flex-row items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-sm leading-none tracking-normal text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-type-accent-strong)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_12%,var(--card))] hover:!text-[var(--registry-type-accent-strong)] dark:hover:!text-[var(--registry-type-accent-strong)] sm:px-3 data-[state=active]:!border-[color-mix(in_srgb,var(--registry-type-accent-strong)_60%,var(--border))] data-[state=active]:!bg-[color-mix(in_srgb,var(--registry-type-accent-strong)_18%,var(--card))] data-[state=active]:font-semibold data-[state=active]:!text-[var(--registry-type-accent-strong)]"
            >
              <Icon className="size-4 shrink-0" aria-hidden={true} />
              <span className="whitespace-nowrap leading-none">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
