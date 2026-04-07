import { Globe, Heart, Users, type LucideIcon } from 'lucide-react';

export const CREDITS_PAGE_CONTENT = {
  title: 'Credits',
  description:
    'The people and contributors helping Subway Builder Modded move forward.',
  icon: Users,
  accentHex: '#FFFFFF',
  sectionIcons: {
    maintainers: Users,
    translators: Globe,
    contributors: Heart,
  } satisfies Record<string, LucideIcon>,
} as const;
