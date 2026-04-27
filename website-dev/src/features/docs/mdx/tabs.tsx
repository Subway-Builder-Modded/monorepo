import type { ReactNode } from "react";
import { Tabs as SharedTabs, TabItem, TabsVariantContext } from "@subway-builder-modded/mdx";
import { resolveLucideIcon as resolveIcon } from "@/features/content/lib/icon-resolver";

type TabsProps = {
  groupId?: string;
  variant?: "default" | "code";
  children: ReactNode;
};

export function Tabs({ groupId, variant = "default", children }: TabsProps) {
  return (
    <SharedTabs groupId={groupId} variant={variant} resolveIcon={resolveIcon}>
      {children}
    </SharedTabs>
  );
}

export { TabItem, TabsVariantContext };
