export {
  MAX_CARD_BADGES,
  SEARCH_BAR_PLACEHOLDER,
  SEARCH_FILTER_EMPTY_LABELS,
} from '@subway-builder-modded/config';

export const FUSE_SEARCH_OPTIONS = {
  keys: ['searchText'],
  threshold: 0.35,
  ignoreLocation: true,
  ignoreFieldNorm: true,
  minMatchCharLength: 1,
  shouldSort: false,
  ignoreDiacritics: true,
};
