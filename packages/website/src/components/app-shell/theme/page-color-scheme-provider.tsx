'use client';

import { usePathname } from 'next/navigation';
import { resolveSiteColorScheme } from '@/config/theme/route-schemes';

export function PageColorSchemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const scheme = resolveSiteColorScheme(pathname ?? '/');

  return (
    <div data-color-scheme={scheme} className="min-h-screen">
      {children}
    </div>
  );
}
