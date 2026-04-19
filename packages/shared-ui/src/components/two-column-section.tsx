import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TwoColumnSectionProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  /** Reverse column order on desktop (right content appears first visually on mobile) */
  reverseOnDesktop?: boolean;
};

export function TwoColumnSection({
  left,
  right,
  className,
  reverseOnDesktop,
}: TwoColumnSectionProps) {
  return (
    <div
      className={cn(
        'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
        className,
      )}
    >
      <div className={cn(reverseOnDesktop && 'order-2 lg:order-1')}>
        {left}
      </div>
      <div className={cn(reverseOnDesktop && 'order-1 lg:order-2')}>
        {right}
      </div>
    </div>
  );
}

