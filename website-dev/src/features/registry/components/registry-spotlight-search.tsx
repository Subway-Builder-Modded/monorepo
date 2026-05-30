import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type RegistrySpotlightSearchProps = {
  isOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
};

export function RegistrySpotlightSearch({
  isOpen,
  query,
  onQueryChange,
  onClose,
}: RegistrySpotlightSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button type="button" className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-x-0 top-0 px-4 pt-[clamp(4rem,12vh,9rem)] sm:px-6">
        <div
          className={cn(
            "mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-white/35",
            "bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl",
            "dark:border-white/12 dark:bg-black/72 dark:shadow-[0_40px_120px_rgba(0,0,0,0.6)]",
          )}
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
            <Search className="size-5 shrink-0 text-foreground/70" aria-hidden={true} />
            <input
              ref={inputRef}
              id="registry-spotlight-search"
              type="search"
              role="searchbox"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search maps, mods, authors..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 appearance-none bg-transparent text-lg text-foreground placeholder:text-muted-foreground/80 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />
            <div className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
              <kbd className="rounded border border-border/70 bg-background/90 px-1.5 py-0.5 font-mono font-medium leading-none">
                {isMac ? "Cmd" : "Ctrl"}
              </kbd>
              <span className="text-muted-foreground/70">+</span>
              <kbd className="rounded border border-border/70 bg-background/90 px-1.5 py-0.5 font-mono font-medium leading-none">
                M
              </kbd>
            </div>
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden={true} />
              </button>
            )}
          </div>

          <div className="border-t border-border/50 px-4 py-3 text-xs text-muted-foreground sm:px-5">
            Press Esc to close. Use {isMac ? "Cmd+M" : "Ctrl+M"} to open search.
          </div>
        </div>
      </div>
    </div>
  );
}
