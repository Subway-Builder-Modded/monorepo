import * as React from 'react';

import { cn } from '@subway-builder-modded/shared-ui';

type GridPreset = 'default' | 'compact';

const presetToGridClassName: Record<GridPreset, string> = {
  default: 'grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
  compact: 'grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
};

export type ResponsiveCardGridProps = Omit<
  React.ComponentProps<'div'>,
  'children'
> & {
  preset?: GridPreset;
  children: React.ReactNode;
};

export function ResponsiveCardGrid({
  preset = 'default',
  className,
  children,
  ...props
}: ResponsiveCardGridProps) {
  return (
    <div
      data-slot="card-grid"
      className={cn('grid items-stretch', presetToGridClassName[preset], className)}
      {...props}
    >
      {children}
    </div>
  );
}
