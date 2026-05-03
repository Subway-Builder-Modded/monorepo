import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";
import { RegistryToolbarDropdown } from "./registry-toolbar-dropdown";

type RegistryTagFilterProps = {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClear: () => void;
  className?: string;
};

export function RegistryTagFilter({
  availableTags,
  selectedTags,
  onTagToggle,
  onClear,
  className,
}: RegistryTagFilterProps) {
  if (availableTags.length === 0) return null;

  const options = availableTags.map((tag) => ({
    id: tag,
    label: tag,
  }));

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <RegistryToolbarDropdown
        multiSelect={true}
        searchable={true}
        searchPlaceholder="Filter tags..."
        options={options}
        values={selectedTags}
        onValuesChange={(next) => {
          const added = next.find((tag) => !selectedTags.includes(tag));
          if (added) {
            onTagToggle(added);
            return;
          }

          const removed = selectedTags.find((tag) => !next.includes(tag));
          if (removed) {
            onTagToggle(removed);
          }
        }}
        triggerAriaLabel="Tag filters"
        triggerContent={
          <>
            <Tag className="size-4 shrink-0" aria-hidden={true} />
            <span>Tags</span>
            {selectedTags.length > 0 ? (
              <span className="rounded border border-current/30 px-1.5 py-0.5 text-xs leading-none">
                {selectedTags.length}
              </span>
            ) : null}
          </>
        }
        footerContent={
          selectedTags.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--tb-accent-light)_10%,var(--background))] hover:text-[var(--tb-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-[color-mix(in_srgb,var(--tb-accent-dark)_12%,var(--background))] dark:hover:text-[var(--tb-accent-dark)]"
            >
              Clear all tags
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
