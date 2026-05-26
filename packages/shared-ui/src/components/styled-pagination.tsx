'use client';

import { useState, useRef, useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

export type StyledPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  className?: string;
  itemLabel?: string; // e.g., "Cards", "Items", "Results"
};

function getVisiblePages(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push('ellipsis');

  pages.push(totalPages);
  return pages;
}

export function StyledPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  className,
  itemLabel = 'Cards',
}: StyledPaginationProps) {
  const visiblePages = getVisiblePages(page, totalPages);
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [resolvedAccent, setResolvedAccent] = useState<{ light: string; dark: string } | null>(null);

  const handlePageSizeOpenChange = (nextOpen: boolean) => {
    if (nextOpen && triggerRef.current) {
      const computed = window.getComputedStyle(triggerRef.current);
      const light = computed.getPropertyValue('--suite-accent-light').trim();
      const dark = computed.getPropertyValue('--suite-accent-dark').trim();
      setResolvedAccent({
        light: light || 'var(--primary)',
        dark: dark || 'var(--primary)',
      });
    }
    setIsPageSizeOpen(nextOpen);
  };

  const selectedPageSizeLabel = useMemo(() => {
    return pageSizeOptions.find((opt) => opt === pageSize) ? `${pageSize}` : 'All';
  }, [pageSize, pageSizeOptions]);

  return (
    <nav
      className={cn(
        'flex flex-col items-center justify-between gap-4 rounded-xl border border-border/30 bg-card px-4 py-3 shadow-sm sm:flex-row',
        className,
      )}
    >
      {/* Left: Page Size Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Showing</span>
        <Popover open={isPageSizeOpen} onOpenChange={handlePageSizeOpenChange}>
          <PopoverTrigger asChild>
            <button
              ref={triggerRef}
              type="button"
              className={cn(
                '[--ps-accent-light:var(--suite-accent-light,var(--primary))] [--ps-accent-dark:var(--suite-accent-dark,var(--primary))] inline-flex h-8 items-center justify-between gap-2 rounded-lg border border-border/30 bg-background px-2.5 text-xs font-semibold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-[color-mix(in_srgb,var(--ps-accent-light)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--ps-accent-light)_8%,var(--background))] hover:text-[var(--ps-accent-light)] dark:hover:border-[color-mix(in_srgb,var(--ps-accent-dark)_30%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--ps-accent-dark)_8%,var(--background))] dark:hover:text-[var(--ps-accent-dark)]',
              )}
            >
              <span className="min-w-8 text-center">{selectedPageSizeLabel}</span>
              <ChevronDown
                className={cn(
                  'size-3 opacity-70 transition-transform duration-200',
                  isPageSizeOpen && 'rotate-180',
                )}
                aria-hidden={true}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={4}
            style={
              resolvedAccent
                ? ({
                    '--ps-accent-light': resolvedAccent.light,
                    '--ps-accent-dark': resolvedAccent.dark,
                  } as React.CSSProperties)
                : undefined
            }
            className={cn(
              '[--ps-accent-light:var(--suite-accent-light,var(--primary))] [--ps-accent-dark:var(--suite-accent-dark,var(--primary))] z-[80] w-[var(--radix-popover-trigger-width)] min-w-0 overflow-hidden rounded-lg border border-border/30 bg-background p-1 shadow-md',
            )}
          >
            <div>
              {pageSizeOptions.map((option) => {
                const isSelected = option === pageSize;
                return (
                  <button
                    key={option}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => {
                      onPageSizeChange(option);
                      setIsPageSizeOpen(false);
                    }}
                    className={cn(
                      'group flex h-8 w-full items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected
                        ? 'bg-[color-mix(in_srgb,var(--ps-accent-light)_12%,var(--background))] text-[var(--ps-accent-light)] dark:bg-[color-mix(in_srgb,var(--ps-accent-dark)_12%,var(--background))] dark:text-[var(--ps-accent-dark)]'
                        : 'text-muted-foreground hover:bg-[color-mix(in_srgb,var(--ps-accent-light)_8%,var(--background))] hover:text-[var(--ps-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--ps-accent-dark)_8%,var(--background))] dark:hover:text-[var(--ps-accent-dark)]',
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <span className="text-xs text-muted-foreground">{itemLabel}</span>
      </div>

      {/* Center: Page Navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
            page <= 1
              ? 'cursor-not-allowed opacity-40 text-muted-foreground'
              : 'text-[color-mix(in_srgb,var(--ps-accent-light)_78%,var(--foreground))] hover:bg-[color-mix(in_srgb,var(--ps-accent-light)_8%,var(--background))] hover:text-[var(--ps-accent-light)] dark:text-[color-mix(in_srgb,var(--ps-accent-dark)_78%,var(--foreground))] dark:hover:bg-[color-mix(in_srgb,var(--ps-accent-dark)_8%,var(--background))] dark:hover:text-[var(--ps-accent-dark)]',
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden={true} />
        </button>

        {visiblePages.map((entry, idx) =>
          entry === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-xs text-muted-foreground"
              aria-hidden={true}
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-semibold transition-colors',
                entry === page
                  ? 'border border-border/35 bg-[color-mix(in_srgb,var(--ps-accent-light)_12%,var(--background))] text-[var(--ps-accent-light)] dark:bg-[color-mix(in_srgb,var(--ps-accent-dark)_12%,var(--background))] dark:text-[var(--ps-accent-dark)]'
                  : 'text-[color-mix(in_srgb,var(--ps-accent-light)_78%,var(--foreground))] hover:bg-[color-mix(in_srgb,var(--ps-accent-light)_8%,var(--background))] hover:text-[var(--ps-accent-light)] dark:text-[color-mix(in_srgb,var(--ps-accent-dark)_78%,var(--foreground))] dark:hover:bg-[color-mix(in_srgb,var(--ps-accent-dark)_8%,var(--background))] dark:hover:text-[var(--ps-accent-dark)]',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
            page >= totalPages
              ? 'cursor-not-allowed opacity-40 text-muted-foreground'
              : 'text-[color-mix(in_srgb,var(--ps-accent-light)_78%,var(--foreground))] hover:bg-[color-mix(in_srgb,var(--ps-accent-light)_8%,var(--background))] hover:text-[var(--ps-accent-light)] dark:text-[color-mix(in_srgb,var(--ps-accent-dark)_78%,var(--foreground))] dark:hover:bg-[color-mix(in_srgb,var(--ps-accent-dark)_8%,var(--background))] dark:hover:text-[var(--ps-accent-dark)]',
          )}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden={true} />
        </button>
      </div>

      {/* Right: Item Range */}
      <div className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{from}–{to}</span>
        <span> of </span>
        <span className="font-semibold text-foreground">{totalItems}</span>
      </div>
    </nav>
  );
}
