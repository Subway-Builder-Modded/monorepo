'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useHydrationSafeTheme(): Theme {
  const [theme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }

    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // localStorage access may fail in some browser contexts.
    }

    return 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    root.style.colorScheme = effectiveTheme;
  }, [theme]);

  return theme;
}