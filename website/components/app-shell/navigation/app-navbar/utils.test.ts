import { describe, expect, it } from 'vitest';
import type {
  AppNavbarDropdownItem,
  AppNavbarItem,
} from '@/config/navigation/navbar';
import {
  defaultItemHref,
  getDropdownItemActiveDepth,
  isActivePath,
  resolveNavbarScheme,
  toSchemeStyle,
} from '@/components/app-shell/navigation/app-navbar/utils';

describe('isActivePath', () => {
  it('matches root route exactly', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/railyard', '/')).toBe(false);
  });

  it('matches exact and nested paths', () => {
    expect(isActivePath('/railyard', '/railyard')).toBe(true);
    expect(isActivePath('/railyard/docs', '/railyard')).toBe(true);
    expect(isActivePath('/railyardness', '/railyard')).toBe(false);
  });
});

describe('defaultItemHref', () => {
  it('prefers explicit href and falls back to item id path', () => {
    const withHref: AppNavbarItem = {
      id: 'x',
      href: '/docs',
      position: 'left',
    };
    const withIdOnly: AppNavbarItem = { id: 'railyard', position: 'left' };

    expect(defaultItemHref(withHref)).toBe('/docs');
    expect(defaultItemHref(withIdOnly)).toBe('/railyard');
  });
});

describe('getDropdownItemActiveDepth', () => {
  it('uses href and activeMatchPaths to find the deepest active match', () => {
    const dropdownItem: AppNavbarDropdownItem = {
      id: 'browse',
      href: '/railyard/browse',
      activeMatchPaths: ['/railyard/mods', '/railyard/mods/popular'],
    };

    expect(
      getDropdownItemActiveDepth('/railyard/mods/popular', dropdownItem),
    ).toBe(3);
    expect(getDropdownItemActiveDepth('/railyard/mods/new', dropdownItem)).toBe(
      2,
    );
    expect(getDropdownItemActiveDepth('/template-mod/docs', dropdownItem)).toBe(
      -1,
    );
  });
});

describe('navbar scheme helpers', () => {
  it('resolves configured scheme and maps to CSS variables', () => {
    const scheme = resolveNavbarScheme('railyard');
    const style = toSchemeStyle(scheme);

    expect(scheme).toBeTruthy();
    expect(style).toMatchObject({
      '--nav-hover-fg-light': expect.any(String),
      '--nav-hover-bg-light': expect.any(String),
      '--nav-active-fg-light': expect.any(String),
      '--nav-indicator-light': expect.any(String),
    });
  });

  it('returns undefined style when scheme is missing', () => {
    expect(resolveNavbarScheme(undefined)).toBeNull();
    expect(toSchemeStyle(null)).toBeUndefined();
  });
});
