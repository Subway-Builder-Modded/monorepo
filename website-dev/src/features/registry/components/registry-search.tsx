import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type RegistrySearchProps = {
  query: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onActivate?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
};

export function RegistrySearch({
  query,
  onChange,
  onSubmit,
  onActivate,
  placeholder = "Search maps, mods, authors…",
  autoFocus = false,
  className,
  inputClassName,
  id = "registry-search",
}: RegistrySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key.length === 1 || e.key === "Backspace") && onActivate) {
      onActivate();
      return;
    }

    if (e.key === "Enter" && onSubmit) {
      onSubmit();
    }
  }

  function handleClear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        className="pointer-events-none absolute left-4 z-10 size-5 text-foreground/60"
        aria-hidden={true}
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="searchbox"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        readOnly={Boolean(onActivate)}
        onFocus={() => onActivate?.()}
        onClick={() => onActivate?.()}
        className={cn(
          "h-14 w-full appearance-none rounded-2xl border border-border/60 bg-background/80 pl-12 pr-12 text-base text-foreground shadow-lg backdrop-blur-md placeholder:text-muted-foreground/70 focus-visible:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          inputClassName,
        )}
      />
      {query.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden={true} />
        </button>
      ) : null}
    </div>
  );
}
