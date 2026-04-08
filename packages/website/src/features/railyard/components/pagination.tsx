'use client';

import {
  Pagination as SharedPagination,
  type PaginationProps as SharedPaginationProps,
} from '@sbm/shared/railyard-ui/shared/pagination';

import { PER_PAGE_OPTIONS, type PerPage } from '../../../lib/railyard/constants';

interface PaginationProps
  extends Omit<SharedPaginationProps, 'perPage' | 'perPageOptions' | 'onPerPageChange'> {
  perPage: PerPage;
  onPerPageChange: (perPage: PerPage) => void;
}

export function Pagination({ onPerPageChange, ...props }: PaginationProps) {
  return (
    <SharedPagination
      {...props}
      perPageOptions={PER_PAGE_OPTIONS}
      onPerPageChange={(value) => onPerPageChange(value as PerPage)}
    />
  );
}

