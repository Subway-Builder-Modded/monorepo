import { ToggleGroup, ToggleGroupItem } from '@subway-builder-modded/shared-ui';
import type { ComponentType } from 'react';

export interface ProjectTabOption {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface ProjectTabsProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly ProjectTabOption[];
  className?: string;
}

export function ProjectTabs({
  value,
  onChange,
  options,
  className,
}: ProjectTabsProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      variant="default"
      size="sm"
      spacing={1}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      className={
        className ??
        'rounded-xl border border-border/70 bg-background p-0.5 shadow-sm'
      }
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => (
        <ToggleGroupItem
          key={optionValue}
          value={optionValue}
          className="h-9 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-accent/45 hover:text-primary data-[state=on]:bg-accent/45 data-[state=on]:text-primary"
        >
          <Icon className="h-4 w-4" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
