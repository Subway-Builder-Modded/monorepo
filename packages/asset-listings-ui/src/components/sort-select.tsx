import {
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@subway-builder-modded/shared-ui';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Download,
  Globe,
  Hash,
  Shuffle,
  Type,
  User,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';

import type { SortFieldOption, SortState } from '../types';

type IconComponent = ComponentType<{ className?: string }>;

export interface SortSelectProps {
  value: SortState;
  onChange: (value: SortState) => void;
  fieldOptions: SortFieldOption[];
  textSortFields?: string[];
  fieldIcons?: Record<string, IconComponent>;
  randomField?: string;
  renderFieldControl?: (args: {
    fieldOptions: SortFieldOption[];
    currentField: string;
    onFieldChange: (field: string) => void;
  }) => React.ReactNode;
}

const DEFAULT_FIELD_ICONS: Record<string, IconComponent> = {
  name: Type,
  city_code: Hash,
  country: Globe,
  author: User,
  population: Users,
  downloads: Download,
  last_updated: Calendar,
  random: Shuffle,
};

function directionArrow(
  field: string,
  direction: 'asc' | 'desc',
  textSortFields: Set<string>,
) {
  const invert = textSortFields.has(field);
  const showUp = invert ? direction === 'desc' : direction === 'asc';
  return showUp ? (
    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
  );
}

export function SortSelect({
  value,
  onChange,
  fieldOptions,
  textSortFields,
  fieldIcons,
  randomField = 'random',
  renderFieldControl,
}: SortSelectProps) {
  const iconMap = fieldIcons ?? DEFAULT_FIELD_ICONS;
  const textFieldsSet = new Set(
    textSortFields ?? ['name', 'author', 'country', 'city_code'],
  );

  const currentFieldValid = fieldOptions.some((f) => f.field === value.field);
  const currentField = currentFieldValid
    ? value.field
    : (fieldOptions.find((opt) => Boolean(iconMap[opt.field]))?.field ??
      fieldOptions[0]?.field ??
      'name');
  const currentOption = fieldOptions.find((opt) => opt.field === currentField);
  const isRandom = currentField === randomField;

  const handleFieldChange = (field: string) => {
    if (field === randomField) {
      onChange({ field, direction: 'asc' });
      return;
    }
    onChange({ field, direction: value.direction });
  };

  const handleDirectionToggle = () => {
    onChange({
      field: currentField,
      direction: value.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-border/70 bg-background/90 shadow-sm backdrop-blur-md">
      {renderFieldControl ? (
        renderFieldControl({
          fieldOptions,
          currentField,
          onFieldChange: handleFieldChange,
        })
      ) : (
        <Select value={currentField} onValueChange={handleFieldChange}>
          <SelectTrigger
            size="sm"
            aria-label="Sort field"
            className={cn(
              'h-8 min-w-[8.5rem] rounded-none border-0 bg-transparent px-3 text-xs font-semibold text-muted-foreground shadow-none focus-visible:ring-0',
              !isRandom && 'rounded-r-none border-r border-border/60',
            )}
          >
            <SelectValue placeholder={currentOption?.label ?? currentField} />
          </SelectTrigger>
          <SelectContent align="start">
            {fieldOptions.map((opt) => {
              return (
                <SelectItem key={opt.field} value={opt.field}>
                  <span>{opt.label}</span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}

      {!isRandom && (
        <button
          type="button"
          onClick={handleDirectionToggle}
          aria-label={
            value.direction === 'asc'
              ? 'Sort ascending - click to sort descending'
              : 'Sort descending - click to sort ascending'
          }
          className={cn(
            'flex h-8 w-8 items-center justify-center',
            'bg-transparent text-muted-foreground transition-colors',
            'hover:bg-accent/45 hover:text-primary',
          )}
        >
          {directionArrow(currentField, value.direction, textFieldsSet)}
        </button>
      )}
    </div>
  );
}

export { DEFAULT_FIELD_ICONS };
