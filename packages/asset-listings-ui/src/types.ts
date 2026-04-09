export type SearchViewMode = 'full' | 'compact' | 'list';

export function isSearchViewMode(value: string): value is SearchViewMode {
  return value === 'full' || value === 'compact' || value === 'list';
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface SortFieldOption {
  field: string;
  label: string;
}

export type GalleryAssetType = 'mod' | 'map';
