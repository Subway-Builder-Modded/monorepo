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
});
