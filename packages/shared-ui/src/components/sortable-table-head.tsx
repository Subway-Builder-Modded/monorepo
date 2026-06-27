import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from './table';

export type SortDirection = 'asc' | 'desc';
export type TableHeadAlign = 'left' | 'right';

function getAlignClassName(align: TableHeadAlign) {
  return align === 'right' ? 'justify-end text-right' : 'justify-start text-left';
}

export function SortableTableHead({
  label,
  active,
  direction,
  onClick,
  align = 'left',
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  align?: TableHeadAlign;
}) {
  const SortIcon = direction === 'asc' ? ArrowUp : ArrowDown;
  const Icon = active ? SortIcon : ArrowUpDown;

  return (
    <TableHead className="px-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex w-full items-center gap-1.5 text-xs font-semibold uppercase leading-4 tracking-[0.12em] transition-colors hover:text-[var(--registry-type-accent)] focus-visible:outline-none ${
          active ? 'text-[var(--registry-type-accent)]' : ''
        } ${getAlignClassName(align)}`}
        style={active ? { color: 'var(--registry-type-accent)' } : undefined}
        aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span className="uppercase">{label}</span>
        <Icon className="size-3.5 shrink-0" aria-hidden={true} />
      </button>
    </TableHead>
  );
}

export function StaticTableHead({
  label,
  align = 'left',
}: {
  label: string;
  align?: TableHeadAlign;
}) {
  return (
    <TableHead className="px-4 text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
      <span
        className={`inline-flex w-full items-center text-xs font-semibold uppercase leading-4 tracking-[0.12em] ${getAlignClassName(
          align,
        )}`}
      >
        {label}
      </span>
    </TableHead>
  );
}
