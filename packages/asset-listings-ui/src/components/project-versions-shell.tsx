import { Skeleton } from '@subway-builder-modded/shared-ui';
import type { ReactNode } from 'react';

export interface ProjectVersionsShellProps {
  header: ReactNode;
  children: ReactNode;
}

export function ProjectVersionsShell({
  header,
  children,
}: ProjectVersionsShellProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {header}
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

export interface ProjectVersionsLoadingStateProps {
  headerSkeletonWidthClassName?: string;
  rowCount?: number;
}

export function ProjectVersionsLoadingState({
  headerSkeletonWidthClassName = 'w-48',
  rowCount = 4,
}: ProjectVersionsLoadingStateProps) {
  return (
    <ProjectVersionsShell
      header={
        <div className="border-b border-border bg-muted/20 px-4 py-2">
          <Skeleton className={`h-4 ${headerSkeletonWidthClassName}`} />
        </div>
      }
    >
      {Array.from({ length: rowCount }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </ProjectVersionsShell>
  );
}
