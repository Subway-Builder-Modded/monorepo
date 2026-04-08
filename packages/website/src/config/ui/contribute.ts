import { Heart } from 'lucide-react';
import type { PageHeaderConfig } from '@/components/shared/page-header';
import type { ContributorTier } from '@/types/registry';

export const CONTRIBUTE_PAGE_CONTENT: PageHeaderConfig = {
  icon: Heart,
  title: 'Contribute',
  description:
    'Help us build the future of Subway Builder. Your support keeps development active and opens exclusive features for our community.',
};

export type SubscriptionTier = {
  id: 'engineer' | 'conductor' | 'executive';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const CONTRIBUTOR_TIER_STYLES: Record<
  ContributorTier,
  { label: string; color: string }
> = {
  developer: { label: 'Developer', color: '#5296D5' },
  engineer: { label: 'Engineer', color: '#D65745' },
  conductor: { label: 'Conductor', color: '#9F2757' },
  executive: { label: 'Executive', color: '#D8833B' },
};

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'engineer',
    name: 'Engineer',
    price: 2,
    period: '/month',
    description: 'For those ready to build with us',
    features: [
      'Access to all release candidates (pre-releases)',
      'Experience development plans before each full release',
      'Supporters-only Discord channel + exclusive role',
      'Higher priority for feature requests',
      'Added to Credits as an "Engineer"',
    ],
  },
  {
    id: 'conductor',
    name: 'Conductor',
    price: 5,
    period: '/month',
    description: 'For our core community leaders',
    features: [
      'Everything in Engineer tier',
      'More exclusive Discord role',
      'Added to Credits as a "Conductor"',
      'Exclusive cosmetic perks & customizations',
    ],
    highlighted: true,
  },
  {
    id: 'executive',
    name: 'Executive',
    price: 10,
    period: '/month',
    description: 'For the visionaries shaping our platform',
    features: [
      'Everything in Engineer & Conductor tiers',
      'Exclusive Executive Discord role',
      'Added to Credits as an "Executive"',
      'Premium cosmetic items & customizations',
    ],
  },
];
