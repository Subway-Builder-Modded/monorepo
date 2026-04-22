import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  SITE_SECTION_PADDING_BOTTOM_CLASS,
  SITE_SECTION_PADDING_TOP_CLASS,
  SITE_SHELL_CLASS,
} from '../lib/layout-tokens';

export type SectionShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  contained?: boolean;
  surfaced?: boolean;
  /**
   * When true, omits bottom section padding and the bottom border on surfaced
   * sections. Use this on the last section before the footer so the footer's
   * own `border-t` acts as the sole separator, preventing a double-border
   * strip with a background-colored gap above the footer.
   */
  noBottomSpacing?: boolean;
};

export function SectionShell({
  children,
  className,
  contentClassName,
  contained = true,
  surfaced,
  noBottomSpacing = false,
}: SectionShellProps) {
  const content = contained ? (
    <div className={cn('relative', SITE_SHELL_CLASS, contentClassName)}>{children}</div>
  ) : (
    children
  );

  return (
    <section
      className={cn(
        'relative overflow-x-clip',
        SITE_SECTION_PADDING_TOP_CLASS,
        !noBottomSpacing && SITE_SECTION_PADDING_BOTTOM_CLASS,
        surfaced && 'bg-muted/20 border-t border-border/40',
        surfaced && !noBottomSpacing && 'border-b border-border/40',
        className,
      )}
    >
      {content}
    </section>
  );
}
