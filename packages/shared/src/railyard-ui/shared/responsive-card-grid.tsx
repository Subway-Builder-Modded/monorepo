import * as React from 'react';

import { cx } from './cx';

type GridPreset = 'default' | 'compact';

const presetToGridClassName: Record<GridPreset, string> = {
  default: 'grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
  compact: 'grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
};

export type ResponsiveCardGridProps = Omit<React.ComponentProps<'div'>, 'children'> & {
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
      className={cx('grid items-stretch', presetToGridClassName[preset], className)}
      {...props}
    >
      {children}
    </div>
  );
}

