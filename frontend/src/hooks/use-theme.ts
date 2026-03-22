import { useEffect } from 'react';

import { useProfileStore } from '@/stores/profile-store';

function normalizeTheme(theme: string): 'dark' | 'light' | 'system' {
  if (theme === 'dark' || theme === 'light' || theme === 'system') {
    return theme;
  }

  const lowered = theme.toLowerCase();
  if (lowered.startsWith('dark')) return 'dark';
  if (lowered.startsWith('light')) return 'light';
  return 'system';
}

function applyThemeClasses(
  root: HTMLElement,
  effectiveTheme: 'dark' | 'light',
) {
  root.classList.toggle('dark', effectiveTheme === 'dark');
}

export function useTheme() {
  const rawTheme = useProfileStore((s) => s.profile?.uiPreferences?.theme);
  const theme = normalizeTheme(rawTheme ?? 'system');

  useEffect(() => {
    const root = document.documentElement;

    if (!root.classList.contains('theme-ready')) {
      requestAnimationFrame(() => root.classList.add('theme-ready'));
    }

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyThemeClasses(root, mql.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        applyThemeClasses(root, e.matches ? 'dark' : 'light');
      };
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }

    applyThemeClasses(root, theme);
  }, [theme]);
}
