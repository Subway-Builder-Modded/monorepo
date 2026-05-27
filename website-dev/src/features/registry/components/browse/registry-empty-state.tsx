import { SearchX } from "lucide-react";
import type { CSSProperties } from "react";
import { getRegistryTypeConfigOrDefault } from "@/features/registry/registry-type-config";
import { REGISTRY_EMPTY_STATE_MESSAGE } from "@/features/registry/registry-content";

type RegistryEmptyStateProps = {
  typeId: string;
  query: string;
  selectedTags: string[];
  onClear: () => void;
};

export function RegistryEmptyState({ typeId, query, selectedTags, onClear }: RegistryEmptyStateProps) {
  const typeConfig = getRegistryTypeConfigOrDefault(typeId);
  const accentStyle = {
    "--registry-empty-accent-light": typeConfig.accentLight,
    "--registry-empty-accent-dark": typeConfig.accentDark,
  } as CSSProperties;

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center" role="status" style={accentStyle}>
      <SearchX className="size-10 text-muted-foreground/40" aria-hidden={true} />
      <p className="text-sm font-medium text-muted-foreground">{REGISTRY_EMPTY_STATE_MESSAGE}</p>
      {(query.length > 0 || selectedTags.length > 0) && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border-[color-mix(in_srgb,var(--registry-empty-accent-light)_30%,var(--border))] text-[var(--registry-empty-accent-light)] hover:border-[color-mix(in_srgb,var(--registry-empty-accent-light)_46%,var(--border))] hover:bg-[color-mix(in_srgb,var(--registry-empty-accent-light)_12%,var(--background))] dark:border-[color-mix(in_srgb,var(--registry-empty-accent-dark)_34%,var(--border))] dark:text-[var(--registry-empty-accent-dark)] dark:hover:border-[color-mix(in_srgb,var(--registry-empty-accent-dark)_52%,var(--border))] dark:hover:bg-[color-mix(in_srgb,var(--registry-empty-accent-dark)_14%,var(--background))]"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
