import { describe, expect, it } from 'vitest';

import {
  isListingStatusLocked,
  visibleListingStatusOptions,
} from '@/components/shared/ListingStatusFilterSection';

describe('visibleListingStatusOptions', () => {
  it('hides classes with no members even while selected', () => {
    // Library's default selects all three; an empty class must not render
    // just because it is selected.
    expect(
      visibleListingStatusOptions(['active', 'deprecated', 'local'], {
        active: 12,
        deprecated: 0,
        deleted: 0,
        local: 0,
      }),
    ).toEqual(['active']);
  });

  it('keeps every class that has members', () => {
    expect(
      visibleListingStatusOptions(['active', 'deprecated', 'deleted'], {
        active: 40,
        deprecated: 2,
        deleted: 5,
        local: 0,
      }),
    ).toEqual(['active', 'deprecated', 'deleted']);
  });
});

describe('isListingStatusLocked', () => {
  it('locks the only visible selected class', () => {
    expect(
      isListingStatusLocked('active', ['active', 'deprecated'], ['active']),
    ).toBe(true);
  });

  it('ignores selected classes that are hidden for having no members', () => {
    // Library: all three selected, only active has members — Active is the
    // effective sole selection and must stay locked.
    expect(
      isListingStatusLocked(
        'active',
        ['active'],
        ['active', 'deprecated', 'local'],
      ),
    ).toBe(true);
  });

  it('unlocks once a second visible class is selected', () => {
    expect(
      isListingStatusLocked(
        'active',
        ['active', 'deprecated'],
        ['active', 'deprecated'],
      ),
    ).toBe(false);
  });
});
