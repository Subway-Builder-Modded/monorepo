import { BrowserOpenURL } from '../../../wailsjs/runtime/runtime';

import {
  type CreditAuthor,
  CreditsModal,
  type CreditsModalProps,
} from '@subway-builder-modded/shared-ui';

import {
  CONTRIBUTOR_TIER_STYLES,
  type ContributorTier,
} from '@/lib/contributor-tier';

import type { types } from '../../../wailsjs/go/models';

interface RailyardCreditsModalProps extends Omit<
  CreditsModalProps,
  'authors' | 'tierConfigs'
> {
  maps: types.MapManifest[];
  mods: types.ModManifest[];
}

function extractUniqueAuthors(
  maps: types.MapManifest[],
  mods: types.ModManifest[],
): Map<string, { tier: ContributorTier | null; author: types.AuthorDetails }> {
  const authorsMap = new Map<
    string,
    { tier: ContributorTier | null; author: types.AuthorDetails }
  >();

  // Process maps
  for (const map of maps) {
    if (map.author?.author_id) {
      const existingTier = authorsMap.get(map.author.author_id)?.tier;
      authorsMap.set(map.author.author_id, {
        author: map.author,
        tier:
          (map.author.contributor_tier as ContributorTier | null) ||
          existingTier ||
          null,
      });
    }
  }

  // Process mods
  for (const mod of mods) {
    if (mod.author?.author_id) {
      const existingTier = authorsMap.get(mod.author.author_id)?.tier;
      authorsMap.set(mod.author.author_id, {
        author: mod.author,
        tier:
          (mod.author.contributor_tier as ContributorTier | null) ||
          existingTier ||
          null,
      });
    }
  }

  return authorsMap;
}

export function RailyardCreditsModal({
  maps,
  mods,
  ...props
}: RailyardCreditsModalProps) {
  const authorsMap = extractUniqueAuthors(maps, mods);

  const creditAuthors: CreditAuthor[] = Array.from(authorsMap.values()).map(
    ({ author, tier }) => ({
      id: author.author_id,
      name: author.author_alias || author.author_id,
      tier,
      attributionLink: author.attribution_link || undefined,
      onAttributionClick: author.attribution_link
        ? () => BrowserOpenURL(author.attribution_link)
        : undefined,
    }),
  );

  return (
    <CreditsModal
      {...props}
      authors={creditAuthors}
      tierConfigs={CONTRIBUTOR_TIER_STYLES as any}
    />
  );
}
