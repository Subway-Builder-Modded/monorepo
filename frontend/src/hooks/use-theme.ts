import { useEffect } from 'react';

import { useProfileStore } from '@/stores/profile-store';

type FullTheme =
  | 'dark'
  | 'light'
  | 'system'
  | 'soft-dark'
  | 'soft-light'
  | 'hc-dark'
  | 'hc-light';

const VALID_THEMES = new Set<FullTheme>([
  'dark',
  'light',
  'system',
  'soft-dark',
  'soft-light',
  'hc-dark',
  'hc-light',
]);

function normalizeTheme(theme: string): FullTheme {
  if (VALID_THEMES.has(theme as FullTheme)) return theme as FullTheme;
  const lowered = theme.toLowerCase();
  if (lowered.startsWith('soft-dark') || lowered === 'softdark') return 'soft-dark';
  if (lowered.startsWith('soft-light') || lowered === 'softlight') return 'soft-light';
  if (lowered.startsWith('hc-dark') || lowered === 'hcdark') return 'hc-dark';
  if (lowered.startsWith('hc-light') || lowered === 'hclight') return 'hc-light';
  if (lowered.startsWith('dark')) return 'dark';
  if (lowered.startsWith('light')) return 'light';
  return 'system';
}

function applyThemeClasses(root: HTMLElement, theme: Exclude<FullTheme, 'system'>) {
  const isDark = theme === 'dark' || theme === 'soft-dark' || theme === 'hc-dark';
  root.classList.toggle('dark', isDark);
  root.classList.toggle('soft-light', theme === 'soft-light');
  root.classList.toggle('soft-dark', theme === 'soft-dark');
  root.classList.toggle('hc-light', theme === 'hc-light');
  root.classList.toggle('hc-dark', theme === 'hc-dark');
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
