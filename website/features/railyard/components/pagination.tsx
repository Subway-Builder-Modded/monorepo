'use client';

import {
  Pagination as SharedPagination,
  type PaginationProps as SharedPaginationProps,
} from '@subway-builder-modded/asset-listings-ui';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PER_PAGE_OPTIONS, type PerPage } from '@/lib/railyard/constants';

interface PaginationProps extends Omit<
  SharedPaginationProps,
  'perPage' | 'onPerPageChange' | 'perPageOptions'
> {
  perPage: PerPage;
  onPerPageChange: (perPage: PerPage) => void;
}

export function Pagination({
  page,
  totalPages,
  totalResults,
  perPage,
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  return (
    <SharedPagination
      page={page}
      totalPages={totalPages}
      totalResults={totalResults}
      perPage={perPage}
      perPageOptions={PER_PAGE_OPTIONS}
      onPageChange={onPageChange}
      onPerPageChange={(value) => onPerPageChange(value as PerPage)}
      renderPerPageControl={({ value, options, onChange }) => (
        <Select
          value={String(value)}
          onValueChange={(v) => onChange(Number(v))}
        >
          <SelectTrigger className="w-16 h-7 text-xs" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={String(opt)} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
