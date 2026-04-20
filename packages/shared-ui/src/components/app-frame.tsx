import type { CSSProperties, ReactNode } from 'react';

import { cn } from '../lib/cn';
import {
  SITE_MAIN_SPACING_CLASS,
  SITE_SHELL_CLASS,
} from '../lib/layout-tokens';

interface AppFrameProps {
  children: ReactNode;
  navbar: ReactNode;
  footer: ReactNode;
  className?: string;
  mainClassName?: string;
  topOffset?: string;
}

export function AppFrame({
  children,
  navbar,
  footer,
  className,
  mainClassName,
  topOffset = 'var(--app-navbar-offset, 6rem)',
}: AppFrameProps) {
  return (
    <div className={cn('min-h-screen bg-background flex flex-col', className)}>
      {navbar}
      <main
        style={{ paddingTop: topOffset } as CSSProperties}
        className={cn(
          'flex-1',
          SITE_SHELL_CLASS,
          SITE_MAIN_SPACING_CLASS,
          mainClassName,
        )}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
