import { describe, expect, it } from 'vitest';

import {
  classifyListingStatus,
  countListingStatuses,
  isListingStatusLocked,
  matchesListingStatus,
  toggleListingStatus,
  visibleListingStatuses,
  type ListingStatus,
} from './listing-status';

describe('classifyListingStatus', () => {
  it('classifies each item into exactly one class', () => {
    expect(classifyListingStatus({ isDeprecated: false, isDeleted: false })).toBe('active');
    expect(classifyListingStatus({ isDeprecated: true, isDeleted: false })).toBe('deprecated');
    expect(classifyListingStatus({ isDeprecated: true, isDeleted: true })).toBe('deleted');
  });

  it('treats Local as its own class: an unmanaged install has no listing', () => {
    expect(
      classifyListingStatus({ isDeprecated: false, isDeleted: false, isLocal: true }),
    ).toBe('local');
  });
});

describe('matchesListingStatus', () => {
  it('matches the selected union', () => {
    expect(matchesListingStatus('deprecated', ['active'])).toBe(false);
    expect(matchesListingStatus('deprecated', ['active', 'deprecated'])).toBe(true);
    expect(matchesListingStatus('deleted', ['deprecated', 'deleted'])).toBe(true);
  });
});

describe('countListingStatuses', () => {
  it('tallies every class', () => {
    const statuses: ListingStatus[] = ['active', 'active', 'deprecated', 'local'];
    expect(countListingStatuses(statuses, (s) => s)).toEqual({
      active: 2,
      deprecated: 1,
      deleted: 0,
      local: 1,
    });
  });
});

describe('toggleListingStatus', () => {
  it('adds and removes classes', () => {
    expect(toggleListingStatus(['active'], 'deprecated')).toEqual(['active', 'deprecated']);
    expect(toggleListingStatus(['active', 'deprecated'], 'active')).toEqual(['deprecated']);
  });

  it('refuses to empty the selection', () => {
    expect(toggleListingStatus(['active'], 'active')).toEqual(['active']);
  });
});

describe('visibleListingStatuses', () => {
  it('hides classes with no members even while selected', () => {
    expect(
      visibleListingStatuses(['active', 'deprecated', 'local'], {
        active: 12,
        deprecated: 0,
        deleted: 0,
        local: 0,
      }),
    ).toEqual(['active']);
  });
});

describe('isListingStatusLocked', () => {
  it('ignores selected classes hidden for having no members', () => {
    expect(
      isListingStatusLocked('active', ['active'], ['active', 'deprecated', 'local']),
    ).toBe(true);
  });

  it('unlocks once a second visible class is selected', () => {
    expect(
      isListingStatusLocked('active', ['active', 'deprecated'], ['active', 'deprecated']),
    ).toBe(false);
  });
});
