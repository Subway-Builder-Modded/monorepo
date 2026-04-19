import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { SITE_SECTION_SPACING_CLASS, SITE_SHELL_CLASS } from '../lib/layout-tokens';

export type SectionShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  contained?: boolean;
  surfaced?: boolean;
};

export function SectionShell({
  children,
  className,
  contentClassName,
  contained = true,
  surfaced,
}: SectionShellProps) {
  const content = contained ? (
    <div className={cn('relative', SITE_SHELL_CLASS, contentClassName)}>{children}</div>
  ) : (
    children
  );

  return (
    <section
      className={cn(
        SITE_SECTION_SPACING_CLASS,
        surfaced &&
          'relative border-y border-border/40 bg-muted/20',
        className,
      )}
    >
      {content}
    </section>
  );
}
