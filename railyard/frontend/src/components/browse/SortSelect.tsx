import {
  DEFAULT_FIELD_ICONS,
  type SortFieldOption,
  SortSelect as SharedSortSelect,
  type SortState as SharedSortState,
} from '@subway-builder-modded/asset-listings-ui';
import {
  Calendar,
  Download,
  Globe,
  HardDrive,
  Hash,
  Shuffle,
  Type,
  User,
  Users,
} from 'lucide-react';
import { useEffect } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import type { AssetType } from '@/lib/asset-types';
import {
  DEFAULT_SORT_STATE,
  getSortOptionsForType,
  type SortField,
  type SortState,
  TEXT_SORT_FIELDS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

const FIELD_ICONS: Record<string, typeof Type> = {
  ...DEFAULT_FIELD_ICONS,
  name: Type,
  city_code: Hash,
  country: Globe,
  author: User,
  population: Users,
  downloads: Download,
  last_updated: Calendar,
  size: HardDrive,
  random: Shuffle,
};

interface SortSelectProps {
  value: SortState;
  onChange: (value: SortState) => void;
  tab: AssetType;
}

export function SortSelect({ value, onChange, tab }: SortSelectProps) {
  const sortOptions = getSortOptionsForType(tab);

  const fieldOptions = sortOptions.reduce<SortFieldOption[]>((acc, opt) => {
    if (!acc.some((f) => f.field === opt.sort.field)) {
      acc.push({ field: opt.sort.field, label: opt.label });
    }
    return acc;
  }, []);

  useEffect(() => {
    if (!fieldOptions.some((f) => f.field === value.field)) {
      onChange(DEFAULT_SORT_STATE);
    }
  }, [fieldOptions, onChange, value.field]);

  return (
    <SharedSortSelect
      value={value as SharedSortState}
      onChange={(next) =>
        onChange({
          field: next.field as SortField,
          direction: next.direction,
        })
      }
      fieldOptions={fieldOptions}
      textSortFields={Array.from(TEXT_SORT_FIELDS)}
      fieldIcons={FIELD_ICONS}
      renderFieldControl={({ fieldOptions, currentField, onFieldChange }) => {
        const Icon = FIELD_ICONS[currentField] ?? Type;

        return (
          <Select value={currentField} onValueChange={onFieldChange}>
            <SelectTrigger
              size="sm"
              className={cn(
                'border-0 bg-transparent shadow-none',
                'dark:bg-transparent dark:hover:bg-transparent',
                'h-8 min-w-[8.5rem] gap-2 px-3',
                'text-xs font-semibold text-muted-foreground',
                'hover:bg-accent/45 hover:text-primary dark:hover:bg-accent/45',
                'data-[state=open]:bg-accent/45 data-[state=open]:text-primary',
                '[&_svg]:!text-current',
                currentField !== 'random' &&
                  'rounded-none border-r border-border/60',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon
                  className="h-3.5 w-3.5 shrink-0 text-current"
                  aria-hidden
                />
                <span className="min-w-0 truncate">
                  {fieldOptions.find((f) => f.field === currentField)?.label ??
                    'Sort'}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent
              side="bottom"
              sideOffset={4}
              position="popper"
              align="end"
              avoidCollisions={false}
              className="rounded-xl border border-border/70 bg-background/95 p-1 shadow-lg backdrop-blur-md"
            >
              {fieldOptions.map((opt) => {
                const OptIcon = FIELD_ICONS[opt.field] ?? Type;
                return (
                  <SelectItem
                    key={opt.field}
                    value={opt.field}
                    className={cn(
                      'rounded-lg text-sm',
                      'data-[highlighted]:bg-accent/45 data-[highlighted]:text-primary',
                      'data-[state=checked]:bg-accent/35 data-[state=checked]:text-primary',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <OptIcon className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      }}
    />
  );
}
