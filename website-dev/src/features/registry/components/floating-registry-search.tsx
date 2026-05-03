import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SITE_SHELL_CLASS } from "@subway-builder-modded/shared-ui";
import { RegistryTypeToggle } from "./registry-type-toggle";
import { RegistryViewToggle } from "./registry-view-toggle";
import { RegistrySortBar } from "./registry-sort-bar";
import { RegistryTagFilter } from "./registry-tag-filter";
import type { RegistrySortId, RegistryViewMode } from "@/features/registry/lib/types";

type FloatingRegistrySearchProps = {
  // Visibility
  isVisible: boolean;
  isSuppressed?: boolean;
  // Search / type
  query: string;
  onActivate: () => void;
  typeId: string;
  counts?: Record<string, number>;
  onTypeChange: (typeId: string) => void;
  // View / sort
  viewMode: RegistryViewMode;
  onViewChange: (mode: RegistryViewMode) => void;
  sortId: RegistrySortId;
  sortDir: "asc" | "desc";
  onSortChange: (sortId: RegistrySortId) => void;
  onDirToggle: () => void;
  onRandomReshuffle: () => void;
  // Tags
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onTagsClear: () => void;
  onClearQuery: () => void;
  isAnchored?: boolean;
  className?: string;
};

export function FloatingRegistrySearch({
  isVisible,
  isSuppressed = false,
  query,
  onActivate,
  typeId,
  counts,
  onTypeChange,
  viewMode,
  onViewChange,
  sortId,
  sortDir,
  onSortChange,
  onDirToggle,
  onRandomReshuffle,
  availableTags,
  selectedTags,
  onTagToggle,
  onTagsClear,
  onClearQuery,
  isAnchored = false,
  className,
}: FloatingRegistrySearchProps) {
  const isShown = isVisible && !isSuppressed;
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes("mac"));
  }, []);

  return (
    <div
      className={cn(
        "inset-x-0 bottom-4 z-40 transition-opacity duration-200 ease-out",
        isAnchored ? "absolute" : "fixed",
        isShown ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
      aria-hidden={!isShown}
    >
      <div className={cn(SITE_SHELL_CLASS)}>
        <div className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--suite-accent-light)_20%,var(--border))] bg-background/92 px-3 py-2 shadow-[0_8px_24px_-10px_rgba(var(--elevation-shadow-rgb),0.45)] backdrop-blur-md dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_26%,var(--border))]">
          <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
            {/* Left — type + view */}
            <div className="flex items-center gap-2">
              <RegistryTypeToggle activeTypeId={typeId} onChange={onTypeChange} counts={counts} />

              <ToolbarSeparator />

              <RegistryViewToggle viewMode={viewMode} onChange={onViewChange} />
            </div>

            {/* Center — search */}
            <div className="group relative flex justify-center">
              <button
                type="button"
                onClick={onActivate}
                className="flex h-10 w-[clamp(14rem,22vw,28rem)] items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Search className="size-4 shrink-0" aria-hidden={true} />
                {query ? (
                  <span className="truncate text-foreground">{query}</span>
                ) : (
                  <span className="flex-1">Search…</span>
                )}
                {!query ? (
                  <span
                    className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
                    aria-hidden={true}
                  >
                    <kbd className="rounded border border-border/70 bg-background/90 px-1.5 py-0.5 font-mono font-medium leading-none">
                      {isMac ? "Cmd" : "Ctrl"}
                    </kbd>
                    <span className="text-muted-foreground/70">+</span>
                    <kbd className="rounded border border-border/70 bg-background/90 px-1.5 py-0.5 font-mono font-medium leading-none">
                      M
                    </kbd>
                  </span>
                ) : null}
              </button>
              {query ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearQuery();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" aria-hidden={true} />
                </button>
              ) : null}
            </div>

            {/* Right — sort + tags */}
            <div className="flex items-center justify-end gap-2">
              <RegistrySortBar
                activeTypeId={typeId}
                sortId={sortId}
                sortDir={sortDir}
                onSortChange={onSortChange}
                onDirToggle={onDirToggle}
                onRandomReshuffle={onRandomReshuffle}
              />

              <ToolbarSeparator />

              <RegistryTagFilter
                availableTags={availableTags}
                selectedTags={selectedTags}
                onTagToggle={onTagToggle}
                onClear={onTagsClear}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarSeparator() {
  return <div aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 rounded-full bg-border/70" />;
}
