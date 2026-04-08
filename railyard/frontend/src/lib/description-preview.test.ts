import { describe, expect, it } from 'vitest';

import { formatListingDescriptionPreview } from './description-preview';

describe('formatListingDescriptionPreview', () => {
  it('strips HTML tags and decodes common entities', () => {
    const input =
      '<p>Best &amp; newest <strong>map</strong><br/>for all players</p>';

    expect(formatListingDescriptionPreview(input)).toBe(
      'Best & newest map for all players',
    );
  });

  it('converts markdown links and formatting to plain text', () => {
    const input = '## Header\nTry **this** [guide](https://example.com) now.';

    expect(formatListingDescriptionPreview(input)).toBe(
      'Header Try this guide now.',
    );
  });

  it('removes scripts and keeps user-facing content', () => {
    const input = '<script>alert(1)</script><p>Safe text</p>';

    expect(formatListingDescriptionPreview(input)).toBe('Safe text');
  });
});
