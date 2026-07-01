import { describe, expect, it } from 'vitest';

import { assetKey } from './asset-key';

describe('assetKey', () => {
  it('composes a stable type:id key', () => {
    expect(assetKey('map', 'map-a')).toBe('map:map-a');
    expect(assetKey('mod', 'mod-x')).toBe('mod:mod-x');
  });

  it('distinguishes assets that differ only by type', () => {
    expect(assetKey('map', 'shared-id')).not.toBe(assetKey('mod', 'shared-id'));
  });
});
