import type { SortDirection } from '../components/sortable-table-head';

export type SortedRankSlotOptions = {
  slotIndex: number;
  totalSlots: number;
  direction: SortDirection;
  highToLowDirection?: SortDirection;
};

export type SortedRankSlotMapOptions<TRow> = {
  rows: TRow[];
  direction: SortDirection;
  getKey: (row: TRow) => string;
  getTieValue?: (row: TRow) => string | number | null | undefined;
  highToLowDirection?: SortDirection;
};

export function getSortedRankSlot({
  slotIndex,
  totalSlots,
  direction,
  highToLowDirection = 'desc',
}: SortedRankSlotOptions) {
  if (slotIndex < 0 || totalSlots <= 0 || slotIndex >= totalSlots) {
    return null;
  }

  return direction === highToLowDirection ? slotIndex + 1 : totalSlots - slotIndex;
}

export function getSortedRankSlotMap<TRow>({
  rows,
  direction,
  getKey,
  getTieValue,
  highToLowDirection = 'desc',
}: SortedRankSlotMapOptions<TRow>) {
  if (!getTieValue) {
    return new Map(
      rows.map((row, index) => [
        getKey(row),
        getSortedRankSlot({
          slotIndex: index,
          totalSlots: rows.length,
          direction,
          highToLowDirection,
        }),
      ]),
    );
  }

  const rankByKey = new Map<string, number | null>();
  let groupStartIndex = 0;

  while (groupStartIndex < rows.length) {
    const tieValue = getTieValue(rows[groupStartIndex] as TRow);
    let groupEndIndex = groupStartIndex;

    while (
      groupEndIndex + 1 < rows.length &&
      Object.is(getTieValue(rows[groupEndIndex + 1] as TRow), tieValue)
    ) {
      groupEndIndex += 1;
    }

    const groupRanks = Array.from(
      { length: groupEndIndex - groupStartIndex + 1 },
      (_, offset) =>
        getSortedRankSlot({
          slotIndex: groupStartIndex + offset,
          totalSlots: rows.length,
          direction,
          highToLowDirection,
        }),
    ).filter((rank): rank is number => rank !== null);
    const tiedRank = groupRanks.length > 0 ? Math.min(...groupRanks) : null;

    for (let index = groupStartIndex; index <= groupEndIndex; index += 1) {
      rankByKey.set(getKey(rows[index] as TRow), tiedRank);
    }

    groupStartIndex = groupEndIndex + 1;
  }

  return rankByKey;
}

export function getSequentialSortedRankSlotMap<TRow>({
  rows,
  direction,
  getKey,
  highToLowDirection = 'desc',
}: Omit<SortedRankSlotMapOptions<TRow>, 'getTieValue'>) {
  return new Map(
    rows.map((row, index) => [
      getKey(row),
      getSortedRankSlot({
        slotIndex: index,
        totalSlots: rows.length,
        direction,
        highToLowDirection,
      }),
    ]),
  );
}
