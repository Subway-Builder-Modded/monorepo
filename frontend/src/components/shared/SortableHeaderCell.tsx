import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ComponentType } from 'react';

import { cn } from '@/lib/utils';

interface SortableHeaderCellProps<T extends string> {
  label: string;
  field: T;
  icon: ComponentType<{ className?: string }>;
  sort: { field: string; direction: 'asc' | 'desc' };
  textFields?: ReadonlySet<string>;
  onSort: (field: T) => void;
  className?: string;
}

export function SortableHeaderCell<T extends string>({
  label,
  field,
  icon: Icon,
  sort,
  textFields,
  onSort,
  className,
}: SortableHeaderCellProps<T>) {
  const isActive = sort.field === field;
  const invert = textFields?.has(field) ?? false;
  const showUp =
    isActive && (invert ? sort.direction === 'desc' : sort.direction === 'asc');
  const SortIcon = showUp ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
      aria-label={`Sort by ${label} ${isActive && sort.direction === 'asc' ? 'descending' : 'ascending'}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
      <SortIcon
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          isActive ? 'opacity-100' : 'opacity-30',
        )}
      />
    </button>
  );
}
