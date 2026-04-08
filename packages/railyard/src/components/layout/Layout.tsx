import React from 'react';

import { AppFooter } from '../../components/layout/AppFooter';
import {
  APP_CONTENT_SPACING_CLASS,
  APP_SHELL_PADDING_CLASS,
  APP_SHELL_WIDTH_CLASS,
} from '../../components/layout/layout-shell';
import { cn } from '../../lib/utils';

export interface LayoutProps {
  children: React.ReactNode;
  appVersion: string;
  navbar: React.ReactNode;
}

export function Layout({ children, appVersion, navbar }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {navbar}
      <main
        style={{ paddingTop: 'var(--app-navbar-offset, 6rem)' }}
        className={cn(
          'flex-1',
          APP_SHELL_WIDTH_CLASS,
          APP_SHELL_PADDING_CLASS,
          APP_CONTENT_SPACING_CLASS,
        )}
      >
        {children}
      </main>
      <AppFooter version={appVersion} />
    </div>
  );
}
