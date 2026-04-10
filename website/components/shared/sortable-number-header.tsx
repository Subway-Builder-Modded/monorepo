'use client';

import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@subway-builder-modded/shared-ui';

export type SortDirection = 'asc' | 'desc';

export function SortableNumberHeader({
  label,
  isActive,
  direction,
  accentColor,
  onToggle,
  align = 'left',
  className,
}: {
  label: string;
  isActive: boolean;
  direction: SortDirection;
  accentColor: string;
  onToggle: () => void;
  align?: 'left' | 'right';
  className?: string;
}) {
  const Icon = !isActive
    ? ArrowUpDown
    : direction === 'asc'
      ? ArrowUpNarrowWide
      : ArrowDownNarrowWide;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1 text-xs uppercase tracking-wider transition-colors',
        align === 'right' ? 'justify-end' : 'justify-start',
        isActive ? 'font-black' : 'font-semibold text-muted-foreground',
        className,
      )}
      style={isActive ? { color: accentColor } : undefined}
    >
      <span>{label}</span>
      <Icon className="size-3.5" />
    </button>
  );
}
