import { getSortOptionsForType, type AssetType } from '@subway-builder-modded/config';

import type { SortFieldOption } from '../types';

export function getSortFieldOptions(type: AssetType): SortFieldOption[] {
  const seen = new Set<string>();
  const fieldOptions: SortFieldOption[] = [];

  for (const option of getSortOptionsForType(type)) {
    if (seen.has(option.sort.field)) continue;
    seen.add(option.sort.field);
    fieldOptions.push({ field: option.sort.field, label: option.label });
  }

  return fieldOptions;
}
