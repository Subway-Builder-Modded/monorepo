import type { types } from '../../wailsjs/go/models';

export type AssetManifest = types.ModManifest | types.MapManifest;

export function manifestAuthorAlias(item: AssetManifest): string {
  return item.author?.author_alias ?? '';
}

export function manifestAuthorAttributionLink(item: AssetManifest): string {
  return item.author?.attribution_link ?? '';
}
