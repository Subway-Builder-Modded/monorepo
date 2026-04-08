import { Search, X } from 'lucide-react';

import { cx } from './cx';

export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchBar({
  query,
  onQueryChange,
  placeholder = 'Search by name, author, description...',
  ariaLabel = 'Search mods and maps',
  className,
  inputClassName,
}: SearchBarProps) {
  return (
    <div className={cx('relative group', className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label={ariaLabel}
        className={cx(
          'h-11 w-full rounded-xl border border-border bg-card pl-11 pr-11 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/25 dark:bg-input/30',
          inputClassName,
        )}
      />
      {query ? (
        <button
          type="button"
          onClick={() => onQueryChange('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

