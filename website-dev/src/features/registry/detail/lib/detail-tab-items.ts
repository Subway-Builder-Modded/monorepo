import { BarChart3, FileText, GalleryHorizontalEnd, History, Info, Map } from "lucide-react";
import type { ComponentType } from "react";
import type { RegistryDetailTabId } from "@/features/registry/registry-type-ui";

export type RegistryDetailTabItem = {
  id: RegistryDetailTabId;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

export const REGISTRY_DETAIL_TAB_ITEMS: RegistryDetailTabItem[] = [
  { id: "description", label: "Description", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd },
  { id: "versions", label: "Versions", icon: History },
  { id: "map", label: "Map", icon: Map },
  { id: "details", label: "Details", icon: Info },
];

const DETAIL_TAB_IDS = new Set<RegistryDetailTabId>(REGISTRY_DETAIL_TAB_ITEMS.map((item) => item.id));

export function resolveRegistryDetailTabId(tabId: string | undefined): RegistryDetailTabId {
  if (!tabId) {
    return "description";
  }

  return DETAIL_TAB_IDS.has(tabId as RegistryDetailTabId)
    ? (tabId as RegistryDetailTabId)
    : "description";
}
