import { describe, expect, it } from 'vitest';

import { getCountryFlagIcon } from './flags';

describe('country flags', () => {
  it('resolves ISO country codes', () => {
    expect(getCountryFlagIcon('jp')).not.toBeNull();
    expect(getCountryFlagIcon('JP')).not.toBeNull();
  });

  it('ignores non-ISO country labels', () => {
    expect(getCountryFlagIcon('Japan')).toBeNull();
    expect(getCountryFlagIcon('USA')).toBeNull();
    expect(getCountryFlagIcon('UK')).toBeNull();
  });

  it('returns null for unknown ISO codes', () => {
    expect(getCountryFlagIcon('XX')).toBeNull();
    expect(getCountryFlagIcon('Atlantis')).toBeNull();
  });
});
