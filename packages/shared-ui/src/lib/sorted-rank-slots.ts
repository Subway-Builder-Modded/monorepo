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
  highToLowDirection = 'desc',
}: SortedRankSlotMapOptions<TRow>) {
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
