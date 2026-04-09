'use client';

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  Download,
  Globe,
  HardDrive,
  Hash,
  Shuffle,
  Type,
  User,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect } from 'react';

import { cx } from './cx';

export type SharedSortDirection = 'asc' | 'desc';

export interface SharedSortState<TField extends string = string> {
  field: TField;
  direction: SharedSortDirection;
}

export interface SharedSortFieldOption<TField extends string = string> {
  field: TField;
  label: string;
}

const FIELD_ICONS: Record<string, ComponentType<{ className?: string }>> = {
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

function hasField<TField extends string>(
  textSortFields: ReadonlySet<TField> | readonly TField[],
  field: TField,
) {
  return Array.isArray(textSortFields)
    ? (textSortFields as readonly TField[]).includes(field)
    : (textSortFields as ReadonlySet<TField>).has(field);
}

function directionArrow<TField extends string>(
  field: TField,
  direction: SharedSortDirection,
  textSortFields: ReadonlySet<TField> | readonly TField[],
) {
  const showUp = hasField(textSortFields, field)
    ? direction === 'desc'
    : direction === 'asc';

  return showUp ? (
    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
  );
}

export interface SharedSortSelectProps<TField extends string = string> {
  value: SharedSortState<TField>;
  onChange: (value: SharedSortState<TField>) => void;
  fieldOptions: SharedSortFieldOption<TField>[];
  defaultValue: SharedSortState<TField>;
  textSortFields: ReadonlySet<TField> | readonly TField[];
  resetKey: string;
  className?: string;
}

export function SharedSortSelect<TField extends string = string>({
  value,
  onChange,
  fieldOptions,
  defaultValue,
  textSortFields,
  resetKey,
  className,
}: SharedSortSelectProps<TField>) {
  const currentFieldValid = fieldOptions.some((option) => option.field === value.field);
  const currentField = currentFieldValid
    ? value.field
    : (fieldOptions[0]?.field ?? defaultValue.field);
  const isRandom = currentField === 'random';

  useEffect(() => {
    if (!fieldOptions.some((option) => option.field === value.field)) {
      onChange(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleFieldChange = (field: string) => {
    if (field === 'random') {
      onChange({ field: field as TField, direction: 'asc' });
      return;
    }

    onChange({ field: field as TField, direction: value.direction });
  };

  const handleDirectionToggle = () => {
    onChange({
      field: value.field,
      direction: value.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const currentOption = fieldOptions.find((option) => option.field === currentField);
  const Icon = FIELD_ICONS[currentField] ?? Type;

  return (
    <div
      className={cx(
        'flex items-center overflow-hidden rounded-xl border border-border/70 bg-background/90 shadow-sm backdrop-blur-md',
        className,
      )}
    >
      <div className={cx('relative', !isRandom && 'border-r border-border/60')}>
        <select
          value={currentField}
          onChange={(event) => handleFieldChange(event.target.value)}
          aria-label="Sort field"
          className="h-8 min-w-[8.5rem] appearance-none bg-transparent py-0 pl-3 pr-8 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:bg-accent/45 hover:text-primary"
        >
          {fieldOptions.map((option) => (
            <option key={option.field} value={option.field}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-current">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="pointer-events-none absolute inset-y-0 left-8 right-8 flex items-center truncate text-xs font-semibold text-muted-foreground">
          {currentOption?.label ?? 'Sort'}
        </span>
      </div>

      {!isRandom && (
        <button
          type="button"
          onClick={handleDirectionToggle}
          aria-label={
            value.direction === 'asc'
              ? 'Sort ascending - click to sort descending'
              : 'Sort descending - click to sort ascending'
          }
          className="flex h-8 w-8 items-center justify-center bg-transparent text-muted-foreground transition-colors hover:bg-accent/45 hover:text-primary"
        >
          {directionArrow(value.field, value.direction, textSortFields)}
        </button>
      )}
    </div>
  );
}

