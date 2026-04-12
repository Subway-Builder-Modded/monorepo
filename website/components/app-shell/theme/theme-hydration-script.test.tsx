import { describe, expect, it } from 'vitest';
import { THEME_HYDRATION_SCRIPT } from '@subway-builder-modded/lifecycle-web/theme-script';

describe('THEME_HYDRATION_SCRIPT', () => {
  it('contains the early light/dark class hydration logic', () => {
    expect(THEME_HYDRATION_SCRIPT).toContain('localStorage.getItem("theme")');
    expect(THEME_HYDRATION_SCRIPT).toContain('classList.add(theme)');
    expect(THEME_HYDRATION_SCRIPT).toContain('colorScheme=theme');
  });
});
