import { Map, Package, type LucideIcon } from "lucide-react";

export type RegistryDetailTabId =
  | "description"
  | "details"
  | "analytics"
  | "gallery"
  | "versions"
  | "map";

export type RegistryTypeUiRules = {
  typeIcon: LucideIcon;
  showMapTab: boolean;
  hasMapMetadata: boolean;
  showBasemapBackground: boolean;
  showDemandDataSection: boolean;
  showFileSizesSection: boolean;
  showDetailsFileSizesSection: boolean;
  showDetailsMapStatsSection: boolean;
};

const DEFAULT_TYPE_UI_RULES: RegistryTypeUiRules = {
  typeIcon: Package,
  showMapTab: false,
  hasMapMetadata: false,
  showBasemapBackground: false,
  showDemandDataSection: false,
  showFileSizesSection: false,
  showDetailsFileSizesSection: false,
  showDetailsMapStatsSection: false,
};

const TYPE_UI_OVERRIDES: Record<string, Partial<RegistryTypeUiRules>> = {
  maps: {
    typeIcon: Map,
    showMapTab: true,
    hasMapMetadata: true,
    showBasemapBackground: true,
    showDemandDataSection: true,
    showFileSizesSection: true,
    showDetailsFileSizesSection: true,
    showDetailsMapStatsSection: true,
  },
};

const BASE_DETAIL_TABS: RegistryDetailTabId[] = [
  "description",
  "analytics",
  "gallery",
  "versions",
  "details",
];

export function getRegistryTypeUiRules(typeId: string): RegistryTypeUiRules {
  return {
    ...DEFAULT_TYPE_UI_RULES,
    ...TYPE_UI_OVERRIDES[typeId],
  };
}

export function getRegistryDetailTabsForType(typeId: string): RegistryDetailTabId[] {
  const rules = getRegistryTypeUiRules(typeId);
  if (!rules.showMapTab) {
    return BASE_DETAIL_TABS;
  }

  return ["description", "analytics", "gallery", "versions", "map", "details"];
}

export function getRegistryTypeIcon(typeId: string): LucideIcon {
  return getRegistryTypeUiRules(typeId).typeIcon;
}
