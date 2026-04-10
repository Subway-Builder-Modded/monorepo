import { ArrowDownToLine, Calendar, Tag } from 'lucide-react';

import { SortableHeaderCell } from './sortable-header-cell';
import type {
  ProjectVersionSortField,
  ProjectVersionSortState,
} from '../lib/project-versions';

export interface ProjectVersionsHeaderProps {
  sort: ProjectVersionSortState;
  onSort: (field: ProjectVersionSortField) => void;
  textFields?: ReadonlySet<string>;
}

export function ProjectVersionsHeader({
  sort,
  onSort,
  textFields,
}: ProjectVersionsHeaderProps) {
  return (
    <div className="flex items-center gap-4 border-b border-border bg-muted/20 px-4 py-2">
      <div className="min-w-0 flex-1">
        <SortableHeaderCell
          label="Version"
          field="version"
          icon={Tag}
          sort={sort}
          textFields={textFields}
          onSort={onSort}
        />
      </div>
      <div className="hidden w-[7rem] shrink-0 sm:block">
        <SortableHeaderCell
          label="Date"
          field="date"
          icon={Calendar}
          sort={sort}
          textFields={textFields}
          onSort={onSort}
        />
      </div>
      <div className="hidden w-[6.5rem] shrink-0 lg:block">
        <SortableHeaderCell
          label="Downloads"
          field="downloads"
          icon={ArrowDownToLine}
          sort={sort}
          textFields={textFields}
          onSort={onSort}
        />
      </div>
      <div className="mx-2 hidden w-px self-stretch bg-border/50 lg:block" aria-hidden />
      <div className="flex w-[7rem] shrink-0 items-center justify-center" aria-hidden />
    </div>
  );
}
