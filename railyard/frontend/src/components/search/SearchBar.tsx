import {
  SearchBar as SharedSearchBar,
  type SearchBarProps as SharedSearchBarProps,
} from '@subway-builder-modded/asset-listings-ui';

import { SEARCH_BAR_PLACEHOLDER } from '@/lib/search';

interface SearchBarProps extends Omit<
  SharedSearchBarProps,
  'placeholder' | 'ariaLabel'
> {}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <SharedSearchBar
      query={query}
      onQueryChange={onQueryChange}
      placeholder={SEARCH_BAR_PLACEHOLDER}
      ariaLabel="Search mods and maps"
    />
  );
}
