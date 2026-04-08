import type { ReactNode } from 'react';
import AppFooter from '@/components/app-shell/footer/app-footer';
import AppNavbar from '@/components/app-shell/navigation/app-navbar';
import { ScrollRestoration } from '@/components/app-shell/navigation/scroll-restoration';
import { PageColorSchemeProvider } from '@/components/app-shell/theme/page-color-scheme-provider';
import { ThemeProvider } from '@/components/app-shell/theme/theme-provider';
import { FooterBars } from '@/components/ui/footer-bars';

export function AppLayoutShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PageColorSchemeProvider>
        <ScrollRestoration />
        <div
          className="flex min-h-screen flex-col"
          style={{ paddingTop: 'var(--app-navbar-offset, 5.5rem)' }}
        >
          <AppNavbar />
          <main className="flex-1">{children}</main>
          <footer
            id="site-footer"
            className="border-t border-border/50 bg-background backdrop-blur-sm"
          >
            <div className="mx-auto flex items-center justify-center">
              <FooterBars />
            </div>
            <AppFooter />
          </footer>
        </div>
      </PageColorSchemeProvider>
    </ThemeProvider>
  );
}
