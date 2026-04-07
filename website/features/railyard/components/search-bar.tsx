'use client';

import {
  SearchBar as SharedSearchBar,
  type SearchBarProps as SharedSearchBarProps,
} from '@sbm/railyard-ui/shared/search-bar';

import { SEARCH_BAR_PLACEHOLDER } from '@/lib/railyard/search';

type SearchBarProps = SharedSearchBarProps;

export function SearchBar(props: SearchBarProps) {
  return <SharedSearchBar {...props} placeholder={SEARCH_BAR_PLACEHOLDER} />;
}
