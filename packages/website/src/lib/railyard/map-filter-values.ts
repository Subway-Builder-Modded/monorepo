export {
  LOCATION_TAGS,
  SOURCE_QUALITY_VALUES,
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  buildSpecialDemandValues,
} from '@sbm/core/railyard/core/map-filter-values';

// Backward-compat aliases for callers not yet migrated (e.g. project-header.tsx)
export { SOURCE_QUALITY_VALUES as DATA_QUALITY_VALUES } from '@sbm/core/railyard/core/map-filter-values';
export { formatSourceQuality as formatDataQuality } from '@sbm/core/railyard/core/map-filter-values';
