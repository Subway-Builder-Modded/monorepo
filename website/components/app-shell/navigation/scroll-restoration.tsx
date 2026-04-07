'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_PREFIX = 'scroll-pos:';

function isReloadNavigation() {
  const [entry] = performance.getEntriesByType(
    'navigation',
  ) as PerformanceNavigationTiming[];
  return entry?.type === 'reload';
}

export function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const key = `${STORAGE_PREFIX}${pathname}`;
    const handleSave = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        // Ignore session storage failures.
      }
    };

    window.addEventListener('scroll', handleSave, { passive: true });
    window.addEventListener('pagehide', handleSave);

    if (isReloadNavigation()) {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const value = Number(saved);
        if (Number.isFinite(value)) {
          requestAnimationFrame(() => {
            window.scrollTo(0, value);
          });
        }
      }
    }

    return () => {
      handleSave();
      window.removeEventListener('scroll', handleSave);
      window.removeEventListener('pagehide', handleSave);
    };
  }, [pathname]);

  return null;
}
