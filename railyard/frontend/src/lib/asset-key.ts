import type { AssetType } from '@subway-builder-modded/config';

// assetKey is the canonical in-memory identity string for an asset (type + id). It is the
// single key format for every Set/Map keyed by asset — selection, pending updates, and
// compatibility lookups — so producers and consumers can never drift apart. Keys are used
// only for equality, never parsed back into (type, id).
export function assetKey(type: AssetType, id: string): string {
  return `${type}:${id}`;
}
