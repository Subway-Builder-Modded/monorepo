import type { CSSProperties } from "react";
import type { ComponentType } from "react";
import { Tabs, TabsList, TabsTrigger } from "@subway-builder-modded/shared-ui";

export type RegistryTabItem<T extends string> = {
  id: T;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

type RegistryTabsProps<T extends string> = {
  value: T;
  tabs: RegistryTabItem<T>[];
  ariaLabel: string;
  onValueChange: (next: T) => void;
};

export function RegistryTabs<T extends string>({
  value,
  tabs,
  ariaLabel,
  onValueChange,
}: RegistryTabsProps<T>) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as T)}>
      <TabsList
        variant="default"
        aria-label={ariaLabel}
        className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border/70 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:[grid-template-columns:repeat(var(--registry-tab-count),minmax(0,1fr))] sm:gap-2 sm:p-2"
        style={
          {
            "--registry-tab-count": tabs.length,
            backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
          } as CSSProperties
        }
      >
        {tabs.map((tab) => {
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
