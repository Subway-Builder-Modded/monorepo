import type {
  SortDirection as SharedSortDirection,
  SortField as SharedSortField,
} from '@subway-builder-modded/config';

export type SortField = SharedSortField | 'size';
export type SortDirection = SharedSortDirection;

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
