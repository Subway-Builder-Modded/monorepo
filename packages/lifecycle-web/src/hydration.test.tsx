// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHydrationSafeTheme } from './hydration';

describe('useHydrationSafeTheme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses a stored theme and applies it to the document root', async () => {
    localStorage.setItem('theme', 'light');

    const { result } = renderHook(() => useHydrationSafeTheme());

    await waitFor(() =>
      expect(document.documentElement.classList.contains('light')).toBe(true),
    );
    expect(result.current).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('falls back to system theme using matchMedia', async () => {
    const { result } = renderHook(() => useHydrationSafeTheme());

    await waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(true),
    );
    expect(result.current).toBe('system');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});