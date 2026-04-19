import { Button } from '@subway-builder-modded/shared-ui';
import { Search, X } from 'lucide-react';
import { startTransition, useEffect, useState } from 'react';

export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  debounceMs?: number;
}

const DEFAULT_PLACEHOLDER = 'Search';
const DEFAULT_ARIA_LABEL = 'Search listings';

export function SearchBar({
  query,
  onQueryChange,
  placeholder = DEFAULT_PLACEHOLDER,
  ariaLabel = DEFAULT_ARIA_LABEL,
  debounceMs = 0,
}: SearchBarProps) {
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    if (draftQuery === query) return;

    if (debounceMs <= 0) {
      startTransition(() => {
        onQueryChange(draftQuery);
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        onQueryChange(draftQuery);
      });
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, draftQuery, onQueryChange, query]);

  return (
    <div className="relative group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
      <input
        placeholder={placeholder}
        value={draftQuery}
        onChange={(e) => setDraftQuery(e.target.value)}
        aria-label={ariaLabel}
        className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-11 text-sm text-foreground shadow-xs placeholder:text-muted-foreground transition-[border-color,box-shadow] outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/25 dark:bg-input/30"
      />
      {draftQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDraftQuery('');
            startTransition(() => {
              onQueryChange('');
            });
          }}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
