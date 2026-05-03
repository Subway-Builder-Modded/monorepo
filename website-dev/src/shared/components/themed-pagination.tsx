import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemedPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  className?: string;
};

function getVisiblePages(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

export function ThemedPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  className,
}: ThemedPaginationProps) {
  const visiblePages = getVisiblePages(page, totalPages);
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label="Registry pagination"
      className={cn(
        "rounded-2xl border border-border/60 bg-background/80 px-3 py-3 backdrop-blur-sm sm:px-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left — summary + per-page dropdown */}
        <div className="flex items-center gap-2.5">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{from}–{to}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span>
          </p>

          <div className="relative">
            <select
              aria-label="Items per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 appearance-none rounded-md border border-border/60 bg-background py-0 pl-2.5 pr-7 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
              aria-hidden={true}
            />
          </div>
        </div>

        {/* Right — page buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border/60 px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronLeft className="size-3.5" aria-hidden={true} />
            Prev
          </button>

          {visiblePages.map((entry, idx) =>
            entry === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-muted-foreground" aria-hidden={true}>
                ...
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-current={entry === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors",
                  entry === page
                    ? "border-[color-mix(in_srgb,var(--suite-accent-light)_40%,var(--border))] bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_42%,var(--border))] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:text-[var(--suite-accent-dark)]"
                    : "border-border/60 bg-background text-muted-foreground hover:bg-muted/45 hover:text-foreground",
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
            aria-label="Next page"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border/60 px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
            <ChevronRight className="size-3.5" aria-hidden={true} />
          </button>
        </div>
      </div>
    </nav>
  );
}
