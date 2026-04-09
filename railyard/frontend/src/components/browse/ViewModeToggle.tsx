import { ViewModeToggle as SharedViewModeToggle } from '@subway-builder-modded/asset-listings-ui';

import type { SearchViewMode } from '@/lib/search-view-mode';

interface ViewModeToggleProps {
  value: SearchViewMode;
  onChange: (value: SearchViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <SharedViewModeToggle
      value={value}
      onChange={(next) => onChange(next as SearchViewMode)}
    />
  );
}
