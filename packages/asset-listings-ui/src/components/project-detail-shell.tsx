import { cn } from '@subway-builder-modded/shared-ui';
import type { CSSProperties, ReactNode } from 'react';

export interface ProjectDetailShellProps {
  className?: string;
  style?: CSSProperties;
  breadcrumb?: ReactNode;
  header: ReactNode;
  tabs: ReactNode;
  body: ReactNode;
}

export function ProjectDetailShell({
  className,
  style,
  breadcrumb,
  header,
  tabs,
  body,
}: ProjectDetailShellProps) {
  return (
    <div className={cn('space-y-5', className)} style={style}>
      {breadcrumb}
      {header}
      <div className="space-y-5">
        {tabs}
        {body}
      </div>
    </div>
  );
}
