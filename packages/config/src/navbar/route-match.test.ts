import { describe, expect, it } from 'vitest';

import { isNavItemActive, isRouteMatch } from './route-match';

describe('isRouteMatch', () => {
  it('supports exact route matching', () => {
    expect(isRouteMatch('/browse', { kind: 'exact', path: '/browse' })).toBe(
      true,
    );
    expect(isRouteMatch('/browse/mods', { kind: 'exact', path: '/browse' })).toBe(
      false,
    );
  });

  it('supports prefix route matching', () => {
    expect(isRouteMatch('/browse', { kind: 'prefix', path: '/browse' })).toBe(
      true,
    );
    expect(
      isRouteMatch('/browse/maps/toronto', {
        kind: 'prefix',
        path: '/browse',
      }),
    ).toBe(true);
  });
});

describe('isNavItemActive', () => {
  it('uses explicit active rules when present', () => {
    expect(
      isNavItemActive('/docs/v1', [{ kind: 'prefix', path: '/docs' }], '/home'),
    ).toBe(true);
  });

  it('falls back to href matching when no rules are provided', () => {
    expect(isNavItemActive('/', undefined, '/')).toBe(true);
    expect(isNavItemActive('/updates/v1', undefined, '/updates')).toBe(true);
    expect(isNavItemActive('/credits', undefined, '/updates')).toBe(false);
  });

  it('returns false when neither rules nor href match', () => {
    expect(isNavItemActive('/docs', undefined, undefined)).toBe(false);
  });
});