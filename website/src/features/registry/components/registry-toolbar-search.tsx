import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type RegistryToolbarSearchProps = {
  query: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  clearLabel?: string;
  shortcutHint?: {
    modifier: string;
    key: string;
  };
};

export function RegistryToolbarSearch({
  query,
  onChange,
  placeholder,
  id,
  className,
  inputClassName,
  clearLabel = "Clear search",
  shortcutHint,
}: RegistryToolbarSearchProps) {
  return (
    <div className={cn("group relative flex", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden={true}
      />
      <input
        id={id}
        type="search"
        role="searchbox"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-border/30 bg-background pl-9 pr-10 text-sm text-muted-foreground placeholder:text-muted-foreground transition-colors hover:border-[color-mix(in_srgb,var(--registry-toolbar-accent-light,var(--registry-type-accent-light,var(--suite-accent-light)))_34%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-toolbar-accent-light,var(--registry-type-accent-light,var(--suite-accent-light)))_5%,var(--background))] focus-visible:border-[color-mix(in_srgb,var(--registry-toolbar-accent-light,var(--registry-type-accent-light,var(--suite-accent-light)))_42%,var(--border))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-toolbar-accent-light,var(--registry-type-accent-light,var(--suite-accent-light)))_34%,transparent)] dark:hover:border-[color-mix(in_srgb,var(--registry-toolbar-accent-dark,var(--registry-type-accent-dark,var(--suite-accent-dark)))_34%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--registry-toolbar-accent-dark,var(--registry-type-accent-dark,var(--suite-accent-dark)))_5%,var(--background))] dark:focus-visible:border-[color-mix(in_srgb,var(--registry-toolbar-accent-dark,var(--registry-type-accent-dark,var(--suite-accent-dark)))_42%,var(--border))] dark:focus-visible:ring-[color-mix(in_srgb,var(--registry-toolbar-accent-dark,var(--registry-type-accent-dark,var(--suite-accent-dark)))_34%,transparent)] [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          shortcutHint && !query ? "pr-24" : "",
          inputClassName,
        )}
      />
      {!query && shortcutHint ? (
        <span
          className="pointer-events-none absolute right-3 top-1/2 ml-auto flex -translate-y-1/2 shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
          aria-hidden={true}
        >
          <kbd className="rounded-md border border-border/45 bg-muted/20 px-1.5 py-0.5 font-mono font-medium leading-none">
            {shortcutHint.modifier}
          </kbd>
          <span>+</span>
          <kbd className="rounded-md border border-border/45 bg-muted/20 px-1.5 py-0.5 font-mono font-medium leading-none">
            {shortcutHint.key}
          </kbd>
        </span>
      ) : null}
      {query ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground opacity-0 transition-[color,opacity] group-hover:opacity-100 hover:text-[var(--registry-toolbar-accent-light,var(--registry-type-accent-light,var(--suite-accent-light)))] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--registry-toolbar-accent-light,var(--registry-type-accent-light,var(--suite-accent-light)))_34%,transparent)] dark:hover:text-[var(--registry-toolbar-accent-dark,var(--registry-type-accent-dark,var(--suite-accent-dark)))] dark:focus-visible:ring-[color-mix(in_srgb,var(--registry-toolbar-accent-dark,var(--registry-type-accent-dark,var(--suite-accent-dark)))_34%,transparent)]"
          aria-label={clearLabel}
        >
          <X className="size-3.5" aria-hidden={true} />
        </button>
      ) : null}
    </div>
  );
}
