import { Button, cn } from '@subway-builder-modded/shared-ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  perPage: number;
  perPageOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  renderPerPageControl?: (args: {
    value: number;
    options: readonly number[];
    onChange: (value: number) => void;
  }) => React.ReactNode;
}

const DEFAULT_PER_PAGE_OPTIONS = [12, 24, 48];

export function Pagination({
  page,
  totalPages,
  totalResults,
  perPage,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  onPageChange,
  onPerPageChange,
  renderPerPageControl,
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

  return (
    <div className="flex items-center justify-between pt-2 border-t border-border">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Show</span>
        {renderPerPageControl ? (
          renderPerPageControl({
            value: perPage,
            options: perPageOptions,
            onChange: onPerPageChange,
          })
        ) : (
          <select
            aria-label="Items per page"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
        <span>per page</span>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {getPageNumbers().map((p) => (
            <Button
              key={p}
              variant={p === page ? 'secondary' : 'ghost'}
              size="icon"
              className={cn('h-7 w-7 text-xs', p === page && 'font-semibold')}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </nav>
      )}

      <p className="text-xs text-muted-foreground tabular-nums">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalResults)} of{' '}
        {totalResults}
      </p>
    </div>
  );
}
