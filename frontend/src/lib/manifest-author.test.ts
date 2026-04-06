import { describe, expect, it } from 'vitest';

import {
  manifestAuthorAlias,
  manifestAuthorAttributionLink,
} from './manifest-author';

describe('manifest author helpers', () => {
  it('reads alias and attribution link from nested author details', () => {
    const item = {
      author: {
        author_id: 'author-a',
        author_alias: 'Alias A',
        attribution_link: 'https://example.com/a',
      },
    } as never;

    expect(manifestAuthorAlias(item)).toBe('Alias A');
    expect(manifestAuthorAttributionLink(item)).toBe('https://example.com/a');
  });

  it('returns empty strings when author details are missing', () => {
    const item = {} as never;
    expect(manifestAuthorAlias(item)).toBe('');
    expect(manifestAuthorAttributionLink(item)).toBe('');
  });
});
