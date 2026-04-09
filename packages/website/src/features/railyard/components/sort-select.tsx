'use client';

import {
  type SharedSortSelectProps,
  SharedSortSelect,
} from '@sbm/core/railyard/ui/shared/sort-select';
import type { AssetType } from '../../../lib/railyard/asset-types';
import {
  DEFAULT_SORT_STATE,
  getSortOptionsForType,
  type SortField,
  type SortState,
  TEXT_SORT_FIELDS,
} from '../../../lib/railyard/constants';

type SortSelectProps = {
  value: SortState;
  onChange: (value: SortState) => void;
  tab: AssetType;
};

export function SortSelect({ value, onChange, tab }: SortSelectProps) {
  const sortOptions = getSortOptionsForType(tab);

  const fieldOptions = sortOptions.reduce<
    Array<{ field: SortField; label: string }>
  >((acc, opt) => {
    if (!acc.some((f) => f.field === opt.sort.field)) {
      acc.push({ field: opt.sort.field, label: opt.label });
    }
    return acc;
  }, []);

  const sharedProps: SharedSortSelectProps<SortField> = {
    value,
    onChange,
    fieldOptions,
    defaultValue: DEFAULT_SORT_STATE,
    textSortFields: TEXT_SORT_FIELDS,
    resetKey: tab,
  };

  return <SharedSortSelect {...sharedProps} />;
}

