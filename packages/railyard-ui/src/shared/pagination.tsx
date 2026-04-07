import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cx } from './cx';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  perPage: number;
  perPageOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  className?: string;
}

function getPageNumbers(page: number, totalPages: number): number[] {
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  for (let currentPage = Math.max(1, end - 4); currentPage <= end; currentPage += 1) {
    pages.push(currentPage);
  }

  return pages;
}

export function Pagination({
  page,
  totalPages,
  totalResults,
  perPage,
  perPageOptions,
  onPageChange,
  onPerPageChange,
  className,
}: PaginationProps) {
  if (totalResults === 0) {
    return null;
  }

  const pageNumbers = getPageNumbers(page, totalPages);
  const rangeStart = (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, totalResults);

  return (
    <div
      className={cx(
        'flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Show</span>
        <div className="relative">
          <select
            value={String(perPage)}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            aria-label="Results per page"
            className="h-7 min-w-16 appearance-none rounded-md border border-input bg-background px-2 pr-7 text-xs text-foreground outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/25"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
            <ChevronRight className="h-3 w-3 rotate-90" aria-hidden="true" />
          </span>
        </div>
        <span>per page</span>
      </div>

      {totalPages > 1 ? (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={cx(
                'flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors',
                pageNumber === page
                  ? 'bg-secondary font-semibold text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </nav>
      ) : null}

      <p className="text-xs tabular-nums text-muted-foreground">
        {rangeStart}–{rangeEnd} of {totalResults}
      </p>
    </div>
  );
}
