import { describe, expect, it } from 'vitest';
import { APP_NAVBAR_SIZES } from '@/config/navigation/navbar';
import { createNavbarConfigStyleVars } from '@/components/app-shell/navigation/app-navbar/style-vars';

describe('createNavbarConfigStyleVars', () => {
  it('maps navbar size config to CSS variable values', () => {
    const vars = createNavbarConfigStyleVars(APP_NAVBAR_SIZES) as Record<
      string,
      string
    >;

    expect(vars['--app-navbar-brand-gap-mobile']).toBe(
      APP_NAVBAR_SIZES.mobile.brand.gap,
    );
    expect(vars['--app-navbar-item-icon-desktop']).toBe(
      APP_NAVBAR_SIZES.desktop.item.iconSize,
    );
    expect(vars['--app-navbar-dd-item-title-mobile']).toBe(
      APP_NAVBAR_SIZES.mobile.dropdown.itemTitleSize,
    );
  });
});
