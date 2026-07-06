import { describe, expect, it } from 'vitest';

import { compareSemver, isUpgrade } from './semver';

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

describe('compareSemver', () => {
  it('orders by semver when both parse', () => {
    expect(compareSemver('1.2.0', '1.10.0')).toBeLessThan(0);
    expect(compareSemver('2.0.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareSemver('1.2.0', '1.2.0')).toBe(0);
  });

  it('tolerates "v" prefixes', () => {
    expect(compareSemver('v1.2.0', '1.10.0')).toBeLessThan(0);
  });

  it('sorts a list ascending consistently', () => {
    const sorted = ['1.10.0', '1.2.0', '2.0.0', '1.9.0'].sort(compareSemver);
    expect(sorted).toEqual(['1.2.0', '1.9.0', '1.10.0', '2.0.0']);
  });

  it('falls back to numeric string comparison for non-semver labels', () => {
    // Neither coerces to semver → numeric-aware localeCompare, not NaN.
    expect(compareSemver('alpha', 'beta')).toBeLessThan(0);
    expect(compareSemver('beta', 'beta')).toBe(0);
  });
});
