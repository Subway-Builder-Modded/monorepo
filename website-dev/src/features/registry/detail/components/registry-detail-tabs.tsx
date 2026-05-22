import { BarChart3, FileText, GalleryHorizontalEnd, History } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@subway-builder-modded/shared-ui";
import type { ComponentType } from "react";

export type RegistryDetailTabId = "description" | "analytics" | "gallery" | "versions";

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
];

export function RegistryDetailTabs({ value, onValueChange }: RegistryDetailTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as RegistryDetailTabId)}>
      <TabsList
        variant="line"
        aria-label="Registry item detail tabs"
        className="border-b border-border/70"
      >
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none px-3 text-sm data-[state=active]:font-semibold data-[state=active]:after:bg-[var(--registry-type-accent)]"
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
