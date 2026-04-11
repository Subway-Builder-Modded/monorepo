import {
  MAX_CARD_BADGES as SHARED_MAX_CARD_BADGES,
  SEARCH_BAR_PLACEHOLDER as SHARED_SEARCH_BAR_PLACEHOLDER,
  SEARCH_FILTER_EMPTY_LABELS as SHARED_SEARCH_FILTER_EMPTY_LABELS,
} from '@subway-builder-modded/config';

export const MAX_CARD_BADGES = SHARED_MAX_CARD_BADGES;
export const SEARCH_BAR_PLACEHOLDER = SHARED_SEARCH_BAR_PLACEHOLDER;
export const SEARCH_FILTER_EMPTY_LABELS = SHARED_SEARCH_FILTER_EMPTY_LABELS;

export const FUSE_SEARCH_OPTIONS = {
  keys: ['searchText'],
  threshold: 0.35,
  ignoreLocation: true,
  ignoreFieldNorm: true,
  minMatchCharLength: 1,
  shouldSort: false,
  ignoreDiacritics: true,
};
