import { describe, expect, it } from 'vitest';

import { SBM_SITE_ORIGIN, sbmAuthorUrl } from './sbm-site';

describe('sbmAuthorUrl', () => {
  it('builds the author profile URL on the SBM origin', () => {
    expect(sbmAuthorUrl('yukina-')).toBe(
      `${SBM_SITE_ORIGIN}/registry/authors/yukina-`,
    );
  });

  it('escapes author ids that need URL encoding', () => {
    expect(sbmAuthorUrl('a b/c')).toBe(
      `${SBM_SITE_ORIGIN}/registry/authors/a%20b%2Fc`,
    );
  });
});
