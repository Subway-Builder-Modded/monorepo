import { cn } from "@subway-builder-modded/shared-ui";
import { ChevronRight } from "lucide-react";
import { getRegistryTagLabel, type TagCategory } from "./registry-filter-sidebar-utils";

type RegistryTagCategorySectionProps = {
  category: TagCategory;
  selectedTags: string[];
  tagCounts: Record<string, number>;
  onTagToggle: (tag: string) => void;
  isCollapsed: boolean;
  onToggleCategory: (categoryId: string) => void;
};

export function RegistryTagCategorySection({
  category,
  selectedTags,
  tagCounts,
  onTagToggle,
  isCollapsed,
  onToggleCategory,
}: RegistryTagCategorySectionProps) {
  const selectedCategoryTags = category.tags.filter((tag) => selectedTags.includes(tag));
  const selectedTagSet = new Set(selectedCategoryTags);
  const availableTags = category.tags.filter((tag) => !selectedTagSet.has(tag));

  return (
    <div className="space-y-1.5 px-1">
      <button
        type="button"
        onClick={() => onToggleCategory(category.id)}
        aria-expanded={!isCollapsed}
        className="group flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left text-foreground transition-colors duration-100 ease-out hover:text-[var(--asset-accent-light)] dark:hover:text-[var(--asset-accent-dark)]"
      >
        <category.icon
          className="size-4 shrink-0 text-foreground transition-colors duration-100 ease-out group-hover:text-[var(--asset-accent-light)] dark:group-hover:text-[var(--asset-accent-dark)]"
          aria-hidden={true}
        />
        <span className="flex-1 text-sm font-semibold tracking-wide text-inherit transition-colors duration-100 ease-out">
          {category.label}
        </span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-[transform,color] duration-150 ease-out group-hover:text-[var(--asset-accent-light)] dark:group-hover:text-[var(--asset-accent-dark)]",
            !isCollapsed && "rotate-90",
          )}
          aria-hidden={true}
        />
      </button>

      {selectedCategoryTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedCategoryTags.map((tag) => {
            const count = tagCounts[tag] ?? 0;
            const displayTag = getRegistryTagLabel(category.id, tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagToggle(tag)}
                className="group inline-flex items-center justify-between gap-2 rounded-md border border-[color-mix(in_srgb,var(--asset-accent-light)_35%,var(--border))] bg-[color-mix(in_srgb,var(--asset-accent-light)_12%,var(--background))] px-2 py-1 text-left text-xs text-[var(--asset-accent-light)] shadow-sm transition-colors duration-100 ease-out dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_35%,var(--border))] dark:bg-[color-mix(in_srgb,var(--asset-accent-dark)_12%,var(--background))] dark:text-[var(--asset-accent-dark)]"
                aria-pressed={true}
              >
                <span className="truncate">{displayTag}</span>
                <span className="rounded-md border border-[color-mix(in_srgb,var(--asset-accent-light)_40%,var(--border))] bg-background px-1.5 py-0.5 text-[11px] tabular-nums text-[var(--asset-accent-light)] dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_40%,var(--border))] dark:text-[var(--asset-accent-dark)]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none",
          isCollapsed ? "mt-0 grid-rows-[0fr] opacity-0" : "mt-1 grid-rows-[1fr] opacity-100",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const count = tagCounts[tag] ?? 0;
              const displayTag = getRegistryTagLabel(category.id, tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagToggle(tag)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-100 ease-out",
                    isSelected
                      ? "bg-background text-[var(--asset-accent-light)] shadow-sm dark:text-[var(--asset-accent-dark)]"
                      : "text-muted-foreground hover:text-[var(--asset-accent-light)] dark:hover:text-[var(--asset-accent-dark)]",
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="truncate">{displayTag}</span>
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-xs tabular-nums transition-[background-color,border-color,color] duration-100 ease-out",
                      isSelected
                        ? "border-[color-mix(in_srgb,var(--asset-accent-light)_40%,var(--border))] bg-[color-mix(in_srgb,var(--asset-accent-light)_12%,var(--background))] text-[var(--asset-accent-light)] dark:border-[color-mix(in_srgb,var(--asset-accent-dark)_40%,var(--border))] dark:bg-[color-mix(in_srgb,var(--asset-accent-dark)_12%,var(--background))] dark:text-[var(--asset-accent-dark)]"
                        : "border-border/30 bg-background text-muted-foreground group-hover:border-[color-mix(in_srgb,var(--asset-accent-light)_35%,var(--border))] group-hover:text-[var(--asset-accent-light)] dark:group-hover:border-[color-mix(in_srgb,var(--asset-accent-dark)_35%,var(--border))] dark:group-hover:text-[var(--asset-accent-dark)]",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
