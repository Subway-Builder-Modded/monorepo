export type ContributorTier =
  | 'developer'
  | 'engineer'
  | 'conductor'
  | 'executive'
  | 'collaborator';

export interface ContributorTierInfo {
  label: string;
  color: string;
}

export const CONTRIBUTOR_TIER_INFO: Record<ContributorTier, ContributorTierInfo> =
  {
    developer: { label: 'Developer', color: '#5296D5' },
    engineer: { label: 'Engineer', color: '#D65745' },
    conductor: { label: 'Conductor', color: '#9F2757' },
    executive: { label: 'Executive', color: '#D8833B' },
    collaborator: { label: 'Collaborator', color: '#925CB1' },
  };

export function getContributorTierInfo(
  tier: string | undefined,
): ContributorTierInfo | null {
  if (!tier) return null;
  return (
    (CONTRIBUTOR_TIER_INFO as Record<string, ContributorTierInfo>)[tier] ?? null
  );
}
