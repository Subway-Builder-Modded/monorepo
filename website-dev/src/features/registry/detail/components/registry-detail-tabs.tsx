import {
  getRegistryDetailTabsForType,
  type RegistryDetailTabId,
} from "@/features/registry/registry-type-ui";
import { RegistryTabs } from "@/features/registry/components/registry-tabs";
import { REGISTRY_DETAIL_TAB_ITEMS } from "@/features/registry/detail/lib/detail-tab-items";

type RegistryDetailTabsProps = {
  value: RegistryDetailTabId;
  typeId: string;
  onValueChange: (next: RegistryDetailTabId) => void;
};

export function RegistryDetailTabs({ value, typeId, onValueChange }: RegistryDetailTabsProps) {
  const visibleTabIds = new Set(getRegistryDetailTabsForType(typeId));
  const visibleTabs = REGISTRY_DETAIL_TAB_ITEMS.filter((tab) => visibleTabIds.has(tab.id));

  return (
    <RegistryTabs
      value={value}
      tabs={visibleTabs}
      ariaLabel="Registry item detail tabs"
      onValueChange={onValueChange}
    />
  );
}
