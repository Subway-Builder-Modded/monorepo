import { describe, expect, it } from 'vitest';

import { resolveWailsDeepLink } from './deeplinks';

describe('resolveWailsDeepLink', () => {
  it('returns a project route when target type and id are present', () => {
    const resolved = resolveWailsDeepLink(
      { type: 'map', id: 'izumo' },
      (type, id) => `/project/${type}/${id}`,
    );

    expect(resolved).toEqual({
      route: '/project/map/izumo',
      shouldLaunchGame: false,
    });
  });

  it('returns a game-start action when requested', () => {
    expect(
      resolveWailsDeepLink({ type: 'GameStart' }, () => '/ignored'),
    ).toEqual({ route: null, shouldLaunchGame: true });
  });

  it('returns no action for incomplete targets', () => {
    expect(resolveWailsDeepLink({ type: 'map' }, () => '/ignored')).toEqual({
      route: null,
      shouldLaunchGame: false,
    });
  });
});