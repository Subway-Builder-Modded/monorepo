import { describe, expect, it } from 'vitest';

import { getSortedRankSlot, getSortedRankSlotMap } from './sorted-rank-slots';

describe('sorted rank slots', () => {
  it('assigns ranks from the top slot when the active sort is high-to-low', () => {
    expect(getSortedRankSlot({ slotIndex: 0, totalSlots: 5, direction: 'desc' })).toBe(1);
    expect(getSortedRankSlot({ slotIndex: 2, totalSlots: 5, direction: 'desc' })).toBe(3);
  });

  it('assigns ranks from the bottom slot when the active sort is low-to-high', () => {
    expect(getSortedRankSlot({ slotIndex: 0, totalSlots: 5, direction: 'asc' })).toBe(5);
    expect(getSortedRankSlot({ slotIndex: 2, totalSlots: 5, direction: 'asc' })).toBe(3);
  });

  it('supports columns whose high-to-low direction is ascending', () => {
    expect(
      getSortedRankSlot({
        slotIndex: 0,
        totalSlots: 5,
        direction: 'asc',
        highToLowDirection: 'asc',
      }),
    ).toBe(1);
  });

  it('returns null for invalid slots', () => {
    expect(getSortedRankSlot({ slotIndex: -1, totalSlots: 5, direction: 'desc' })).toBeNull();
    expect(getSortedRankSlot({ slotIndex: 5, totalSlots: 5, direction: 'desc' })).toBeNull();
    expect(getSortedRankSlot({ slotIndex: 0, totalSlots: 0, direction: 'desc' })).toBeNull();
  });

  it('preserves full sorted slot ranks when rows are filtered later', () => {
    const rows = [
      { id: 'tokyo' },
      { id: 'osaka' },
      { id: 'guangzhou' },
      { id: 'seoul' },
    ];
    const rankById = getSortedRankSlotMap({
      rows,
      direction: 'desc',
      getKey: (row) => row.id,
    });
    const filteredRows = rows.filter((row) => row.id === 'guangzhou');

    expect(rankById.get(filteredRows[0]?.id ?? '')).toBe(3);
  });

  it('assigns tied rows the best rank number in their tied slot range', () => {
    const rows = [
      { id: 'alpha', downloads: 100 },
      { id: 'beta', downloads: 80 },
      { id: 'gamma', downloads: 80 },
      { id: 'delta', downloads: 20 },
    ];
    const rankById = getSortedRankSlotMap({
      rows,
      direction: 'desc',
      getKey: (row) => row.id,
      getTieValue: (row) => row.downloads,
    });

    expect(rankById.get('alpha')).toBe(1);
    expect(rankById.get('beta')).toBe(2);
    expect(rankById.get('gamma')).toBe(2);
    expect(rankById.get('delta')).toBe(4);
  });

  it('uses the best tied rank number when sort direction is reversed', () => {
    const rows = [
      { id: 'delta', downloads: 20 },
      { id: 'beta', downloads: 80 },
      { id: 'gamma', downloads: 80 },
      { id: 'alpha', downloads: 100 },
    ];
    const rankById = getSortedRankSlotMap({
      rows,
      direction: 'asc',
      getKey: (row) => row.id,
      getTieValue: (row) => row.downloads,
    });

    expect(rankById.get('delta')).toBe(4);
    expect(rankById.get('beta')).toBe(2);
    expect(rankById.get('gamma')).toBe(2);
    expect(rankById.get('alpha')).toBe(1);
  });
});
