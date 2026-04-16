import { describe, expect, it } from 'vite-plus/test';

import { THEME_HYDRATION_SCRIPT } from './theme-script';

describe('THEME_HYDRATION_SCRIPT', () => {
  it('contains the expected early theme hydration logic', () => {
    expect(THEME_HYDRATION_SCRIPT).toContain('localStorage.getItem("theme")');
    expect(THEME_HYDRATION_SCRIPT).toContain('classList.add(theme)');
    expect(THEME_HYDRATION_SCRIPT).toContain('colorScheme=theme');
  });
});