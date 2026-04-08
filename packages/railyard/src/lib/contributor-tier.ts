import type { LucideIcon } from 'lucide-react';
import { CodeXml, Heart, UsersRound } from 'lucide-react';

export type ContributorTier =
  | 'developer'
  | 'engineer'
  | 'conductor'
  | 'executive'
  | 'collaborator';

export interface ContributorTierStyle {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const CONTRIBUTOR_TIER_STYLES: Record<
  ContributorTier,
  ContributorTierStyle
> = {
  developer: { label: 'Developer', color: '#5296D5', icon: CodeXml },
  engineer: { label: 'Engineer', color: '#D65745', icon: Heart },
  conductor: { label: 'Conductor', color: '#9F2757', icon: Heart },
  executive: { label: 'Executive', color: '#D8833B', icon: Heart },
  collaborator: { label: 'Collaborator', color: '#925CB1', icon: UsersRound },
};

export function getContributorTierStyle(
  tier: string | undefined,
): ContributorTierStyle | null {
  if (!tier) return null;
  return (
    (CONTRIBUTOR_TIER_STYLES as Record<string, ContributorTierStyle>)[tier] ??
    null
  );
}
