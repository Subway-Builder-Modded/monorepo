import { describe, expect, it } from 'vitest';

import { isUpgrade } from './semver';

describe('isUpgrade', () => {
  it('is true only for a strictly newer version', () => {
    expect(isUpgrade('1.3.0', '1.2.0')).toBe(true);
    expect(isUpgrade('2.0.0', '1.9.9')).toBe(true);
  });

  it('is false for an equal version', () => {
    expect(isUpgrade('1.2.0', '1.2.0')).toBe(false);
  });

  it('is false for an older version (the downgrade edge case)', () => {
    // The latest game-compatible release can be older than what is installed.
    expect(isUpgrade('1.1.0', '1.2.0')).toBe(false);
  });

  it('tolerates a "v" prefix on either side', () => {
    expect(isUpgrade('v1.3.0', '1.2.0')).toBe(true);
    expect(isUpgrade('1.3.0', 'v1.2.0')).toBe(true);
    expect(isUpgrade('v1.2.0', 'v1.2.0')).toBe(false);
  });

  it('is false when either version is unparseable', () => {
    expect(isUpgrade('not-a-version', '1.2.0')).toBe(false);
    expect(isUpgrade('1.3.0', '')).toBe(false);
  });
});
