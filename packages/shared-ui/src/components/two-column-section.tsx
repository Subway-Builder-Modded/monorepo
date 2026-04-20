import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TwoColumnSectionProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftContentClassName?: string;
  rightContentClassName?: string;
  reverseOnDesktop?: boolean;
};

export function TwoColumnSection({
  left,
  right,
  className,
  leftContentClassName,
  rightContentClassName,
  reverseOnDesktop,
}: TwoColumnSectionProps) {
  return (
    <div
      className={cn(
        'grid items-start gap-10 md:gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 min-[1920px]:gap-20 min-[2560px]:gap-24',
        className,
      )}
    >
      <div className={cn('min-w-0', reverseOnDesktop && 'order-2 lg:order-1')}>
        <div className={cn('flex w-full min-w-0 justify-center', leftContentClassName)}>{left}</div>
      </div>
      <div className={cn('min-w-0', reverseOnDesktop && 'order-1 lg:order-2')}>
        <div className={cn('flex w-full min-w-0 justify-center', rightContentClassName)}>{right}</div>
      </div>
    </div>
  );
}

