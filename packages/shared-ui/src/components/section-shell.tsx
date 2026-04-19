import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type SectionShellProps = {
  children: ReactNode;
  className?: string;
  surfaced?: boolean;
};

const HOMEPAGE_SHELL =
  'mx-auto w-full max-w-[1800px] px-5 sm:px-7 lg:px-10 xl:px-14 2xl:px-16';

export { HOMEPAGE_SHELL };

export function SectionShell({
  children,
  className,
  surfaced,
}: SectionShellProps) {
  return (
    <section
      className={cn(
        'py-16 lg:py-24',
        surfaced &&
          'relative border-y border-border/40 bg-muted/20',
        className,
      )}
    >
      <div className={cn('relative', HOMEPAGE_SHELL)}>{children}</div>
    </section>
  );
}
