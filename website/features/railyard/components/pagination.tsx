'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PER_PAGE_OPTIONS, type PerPage } from '@/lib/railyard/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  perPage: PerPage;
  onPageChange: (page: number) => void;
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
  if (totalResults === 0) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = Math.max(1, end - 4); i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const rangeStart = (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, totalResults);

  return (
    <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
      {/* Per-page selector */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Show</span>
        <Select
          value={String(perPage)}
          onValueChange={(v) => onPerPageChange(Number(v) as PerPage)}
        >
          <SelectTrigger className="w-16 h-7 text-xs" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PER_PAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>per page</span>
      </div>

      {/* Page buttons */}
      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              className={cn(
                'h-7 w-7 flex items-center justify-center rounded-md text-xs transition-colors',
                p === page
                  ? 'bg-secondary text-secondary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}

      {/* Total count */}
      <p className="text-xs text-muted-foreground tabular-nums">
        {rangeStart}–{rangeEnd} of {totalResults}
      </p>
    </div>
  );
}
