import {
  BookText,
  Download,
  GitPullRequestArrow,
  Globe,
  Home,
  Package,
  Rocket,
  TrainTrack,
  Users,
  Database,
  ChartLine,
  FolderGit2,
  Coffee,
  Heart,
} from 'lucide-react';
import type { HomeLink, HomeProjectCard } from '@/config/site/homepage.types';

const GITHUB_MASK_ICON = 'github';
const DISCORD_MASK_ICON = 'discord';

export const HOME_THEME = {
  accent: {
    light: '#0A0A0A',
    dark: '#FFFFFF',
  },
  textOnAccent: {
    light: '#FFFFFF',
    dark: '#0A0A0A',
  },
  accentSoft: {
    light: 'rgba(10, 10, 10, 0.1)',
    dark: 'rgba(255, 255, 255, 0.14)',
  },
} as const;

export const HOME_SUBWAY_BARS = [
  '#0039A6',
  '#FF6319',
  '#00933C',
  '#FCCC0A',
  '#752F82',
] as const;

export const HOME_HERO = {
  title: 'Subway Builder Modded',
  description: 'The complete hub for everything modded in Subway Builder.',
  backgroundImage: {
    light: '/images/home/light.png',
    dark: '/images/home/dark.png',
    alt: 'Subway Builder Modded hero background',
  },
  primaryActions: [
    {
      label: 'GitHub',
      href: 'https://github.com/Subway-Builder-Modded',
      external: true,
      variant: 'solid',
      icon: GITHUB_MASK_ICON,
      scheme: 'default',
      size: 'xl',
    },
    {
      label: 'Discord',
      href: 'https://discord.gg/syG9YHMyeG',
      external: true,
      variant: 'outline',
      icon: DISCORD_MASK_ICON,
      scheme: 'default',
      size: 'xl',
    },
  ] satisfies HomeLink[],
} as const;

export const HOME_PROJECT_SECTION = {
  title: 'Projects',
  description: 'Explore projects in the Subway Builder Modded ecosystem.',
  cards: [
    {
      id: 'railyard',
      title: 'Railyard',
      description: 'All-in-one Map and Mod Manager for Subway Builder.',
      scheme: 'railyard',
      icon: TrainTrack,
      image: {
        light: '/images/shared/railyard-light.png',
        dark: '/images/shared/railyard-dark.png',
        alt: 'Railyard preview',
      },
      buttons: [
        {
          label: 'Download',
          href: '/railyard',
          variant: 'solid',
          icon: Download,
          scheme: 'railyard',
          size: 'md',
        },
        {
          label: 'Browse Content',
          href: '/railyard/browse',
          variant: 'outline',
          icon: Rocket,
          scheme: 'railyard',
          size: 'md',
        },
      ],
    },
    {
      id: 'registry',
      title: 'Registry',
      description:
        'The GitHub-hosted registry powering Railyard and its services.',
      scheme: 'registry',
      icon: Database,
      image: {
        light: '/images/shared/registry-light.png',
        dark: '/images/shared/registry-dark.png',
        alt: 'Registry preview',
      },
      buttons: [
        {
          label: 'Analytics',
          href: '/registry',
          external: false,
          variant: 'solid',
          icon: ChartLine,
          scheme: 'registry',
          size: 'md',
        },
        {
          label: 'View the Registry',
          href: 'https://github.com/Subway-Builder-Modded/registry',
          external: true,
          variant: 'outline',
          icon: FolderGit2,
          scheme: 'registry',
          size: 'md',
        },
      ],
    },
    {
      id: 'template-mod',
      title: 'Template Mod',
      description:
        'The all-inclusive TypeScript template to create your own mods for Subway Builder.',
      scheme: 'template-mod',
      icon: Package,
      image: {
        light: '/images/shared/template-mod-light.png',
        dark: '/images/shared/template-mod-dark.png',
        alt: 'Template Mod preview',
      },
      buttons: [
        {
          label: 'Home',
          href: '/template-mod',
          external: false,
          variant: 'solid',
          icon: Home,
          scheme: 'template-mod',
          size: 'md',
        },
        {
          label: 'Documentation',
          href: '/template-mod/docs',
          variant: 'outline',
          icon: BookText,
          scheme: 'template-mod',
          size: 'md',
        },
      ],
    },
    {
      id: 'website',
      title: 'Website',
      description:
        'Central place for docs, analytics, and community resources across all Subway Builder Modded projects.',
      scheme: 'website',
      icon: Globe,
      image: {
        light: '/images/shared/website-light.png',
        dark: '/images/shared/website-dark.png',
        alt: 'Website preview',
      },
      buttons: [
        {
          label: 'Analytics',
          href: '/website',
          variant: 'solid',
          icon: ChartLine,
          scheme: 'website',
          size: 'md',
        },
        {
          label: 'Contribute',
          href: 'https://github.com/Subway-Builder-Modded/website',
          external: true,
          variant: 'outline',
          icon: GitPullRequestArrow,
          scheme: 'website',
          size: 'md',
        },
      ],
    },
  ] satisfies HomeProjectCard[],
} as const;

export const HOME_OPEN_SOURCE_SECTION = {
  title: 'Open Source',
  description:
    'Subway Builder Modded is and always will be completely open-source. Contributions, bug reports, docs improvements, and new ideas are all welcome.',
  points: [
    'Public codebases with transparent development.',
    'Community-maintained and updated docs and changelogs.',
    'Built for stability, extensibility, and clear contributor workflows.',
  ],
  links: [
    {
      label: 'GitHub',
      href: 'https://github.com/Subway-Builder-Modded',
      external: true,
      variant: 'solid',
      icon: GITHUB_MASK_ICON,
      scheme: 'default',
      size: 'md',
    },
    {
      label: 'Credits',
      href: '/credits',
      variant: 'outline',
      icon: Users,
      scheme: 'default',
      size: 'md',
    },
  ] satisfies HomeLink[],
} as const;

export const HOME_CONTRIBUTE_SECTION = {
  title: 'Contribute',
  description:
    'Support ongoing development and help us ship new features faster while keeping everything free and open for everyone.',
  points: [
    'Directly helps fund infrastructure and active development.',
    'Supporters get early access to release candidates and roadmap previews.',
    'Every contribution helps prioritize fixes, features, and long-term improvements.',
  ],
  links: [
    {
      label: 'More Information',
      href: '/contribute',
      variant: 'solid',
      icon: Heart,
      scheme: 'default',
      size: 'md',
    },
    {
      label: 'Support on Ko-fi',
      href: '/contribute',
      variant: 'outline',
      icon: Coffee,
      scheme: 'default',
      size: 'md',
    },
  ] satisfies HomeLink[],
} as const;

export const HOME_COMMUNITY_SECTION = {
  title: 'Join The Community',
  description:
    'Get support, share feedback, show your creations, and help shape the roadmap with other builders and modders.',
  links: [
    {
      label: 'Join the Discord',
      href: 'https://discord.gg/syG9YHMyeG',
      external: true,
      variant: 'solid',
      icon: DISCORD_MASK_ICON,
      scheme: 'default',
      size: 'md',
    },
  ] satisfies HomeLink[],
} as const;
