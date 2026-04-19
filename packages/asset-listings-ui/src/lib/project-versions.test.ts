import { describe, expect, it } from 'vitest';

import {
  formatDetailedProjectVersionDate,
  formatProjectVersionDate,
  parseProjectVersionDate,
  sortProjectVersions,
} from './project-versions';

describe('project version dates', () => {
  it('parses custom feed date-only values as UTC midnight', () => {
    expect(parseProjectVersionDate('2026-04-14')).toBe(Date.UTC(2026, 3, 14));
  });

  it('formats date-only values consistently in UTC', () => {
    expect(formatProjectVersionDate('2026-04-14')).toBe('2026-04-14');
  });

  it('formats timestamp values as UTC calendar dates by default', () => {
    expect(formatProjectVersionDate('2026-04-14T03:51:46Z')).toBe(
      '2026-04-14',
    );
  });

  it('formats timestamp values with explicit UTC time detail when requested', () => {
    expect(formatDetailedProjectVersionDate('2026-04-14T03:51:46Z')).toBe(
      '2026-04-14T03:51Z',
    );
  });

  it('sorts version rows by parsed UTC dates', () => {
    const rows = [
      { version: '1.0.0', date: '2026-04-14', downloads: 0 },
      { version: '1.1.0', date: '2026-04-15T03:51:46Z', downloads: 0 },
    ];

    expect(
      sortProjectVersions(rows, { field: 'date', direction: 'desc' }).map(
        (row) => row.version,
      ),
    ).toEqual(['1.1.0', '1.0.0']);
  });
});
