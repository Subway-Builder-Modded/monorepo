import {
  WEBSITE_SHARED_NAVBAR_MODEL,
  type SharedNavItem,
} from '@subway-builder-modded/config';
import {
  BookText,
  ChartLine,
  Database,
  Download,
  FileCode2,
  FileSearchCorner,
  Globe,
  Heart,
  HeartHandshake,
  Home,
  Megaphone,
  Moon,
  Package,
  Scale,
  Sun,
  SunMoon,
  TrainTrack,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import type {
  AppNavbarBrand,
  AppNavbarConfig,
  AppNavbarItem,
  AppNavbarSizes,
} from '@/config/navigation/navbar.types';

export const APP_NAVBAR_SIZES: AppNavbarSizes = {
  mobile: {
    brand: {
      gap: '0rem',
      iconSize: '1.14rem',
      titleSize: '0.92rem',
      titleWeight: 710,
    },
    item: {
      gap: '0.22rem',
      iconSize: '1em',
      titleSize: '0.72rem',
      radius: '0.54rem',
      paddingX: '0.24rem',
      paddingY: '0.3rem',
    },
    dropdown: {
      minWidth: '12.25rem',
      itemGap: '0.28rem',
      itemIconSize: '1em',
      itemTitleSize: '0.72rem',
      itemRadius: '0.58rem',
      itemPaddingX: '0.52rem',
      itemPaddingY: '0.4rem',
    },
  },
  desktop: {
    brand: {
      gap: '0rem',
      iconSize: '1.28rem',
      titleSize: '0.93rem',
      titleWeight: 740,
    },
    item: {
      gap: '0.28rem',
      iconSize: '1em',
      titleSize: '0.68rem',
      radius: '0.54rem',
      paddingX: '0.42rem',
      paddingY: '0.3rem',
    },
    dropdown: {
      minWidth: '12.4rem',
      itemGap: '0.3rem',
      itemIconSize: '1em',
      itemTitleSize: '0.72rem',
      itemRadius: '0.58rem',
      itemPaddingX: '0.56rem',
      itemPaddingY: '0.4rem',
    },
  },
};

const APP_NAVBAR_BRAND: AppNavbarBrand = {
  title: WEBSITE_SHARED_NAVBAR_MODEL.brand.title,
  href: WEBSITE_SHARED_NAVBAR_MODEL.brand.href,
  iconKey: WEBSITE_SHARED_NAVBAR_MODEL.brand.iconKey,
  icon: 'logo',
};

const SHARED_ITEMS_BY_ID = new Map<string, SharedNavItem>(
  WEBSITE_SHARED_NAVBAR_MODEL.sections
    .flatMap((section) => section.items)
    .map((item) => [item.id, item]),
);

function getSharedItem(id: string): SharedNavItem {
  const sharedItem = SHARED_ITEMS_BY_ID.get(id);
  if (!sharedItem) {
    throw new Error(`Missing shared navbar item: ${id}`);
  }

  return sharedItem;
}

const railyardShared = getSharedItem('railyard');
const registryShared = getSharedItem('registry');
const templateModShared = getSharedItem('template-mod');
const websiteShared = getSharedItem('website');
const toolsShared = getSharedItem('tools');
const communityShared = getSharedItem('community');
const discordShared = getSharedItem('discord');
const githubShared = getSharedItem('github');
const themeShared = getSharedItem('theme');

const APP_NAVBAR_ITEMS: AppNavbarItem[] = [
  {
    id: railyardShared.id,
    title: railyardShared.label,
    href: railyardShared.href,
    iconKey: railyardShared.iconKey,
    activeMatchRules: railyardShared.activeMatchRules,
    icon: TrainTrack,
    position: 'left',
    schemeId: 'railyard',
    dropdown: [
      {
        id: 'railyard-home',
        title: 'Download',
        href: '/railyard',
        icon: Download,
        schemeId: 'railyard',
      },
      {
        id: 'railyard-analytics',
        title: 'Analytics',
        href: '/railyard/analytics',
        icon: ChartLine,
        schemeId: 'railyard',
      },
      {
        id: 'railyard-browse',
        title: 'Browse',
        href: '/railyard/browse',
        activeMatchPaths: ['/railyard/mods', '/railyard/maps'],
        icon: FileSearchCorner,
        schemeId: 'railyard',
      },
      {
        id: 'railyard-docs',
        title: 'Docs',
        href: '/railyard/docs',
        icon: BookText,
        schemeId: 'railyard',
      },
      {
        id: 'railyard-updates',
        title: 'Updates',
        href: '/railyard/updates',
        icon: Megaphone,
        schemeId: 'railyard',
      },
    ],
  },
  {
    id: registryShared.id,
    title: registryShared.label,
    href: registryShared.href,
    iconKey: registryShared.iconKey,
    activeMatchRules: registryShared.activeMatchRules,
    icon: Database,
    position: 'left',
    schemeId: 'registry',
    dropdown: [
      {
        id: 'registry-home',
        title: 'Analytics',
        href: '/registry',
        icon: ChartLine,
        schemeId: 'registry',
      },
      {
        id: 'registry-trending',
        title: 'Trending',
        href: '/registry/trending',
        icon: TrendingUp,
        schemeId: 'registry',
      },
      {
        id: 'registry-world-map',
        title: 'World Map',
        href: '/registry/world-map',
        icon: Globe,
        schemeId: 'registry',
      },
    ],
  },
  {
    id: templateModShared.id,
    title: templateModShared.label,
    href: templateModShared.href,
    iconKey: templateModShared.iconKey,
    activeMatchRules: templateModShared.activeMatchRules,
    icon: Package,
    position: 'left',
    schemeId: 'template-mod',
    dropdown: [
      {
        id: 'template-mod-home',
        title: 'Home',
        href: '/template-mod',
        icon: Home,
        schemeId: 'template-mod',
      },
      {
        id: 'template-mod-docs',
        title: 'Docs',
        href: '/template-mod/docs',
        icon: BookText,
        schemeId: 'template-mod',
      },
      {
        id: 'template-mod-updates',
        title: 'Updates',
        href: '/template-mod/updates',
        icon: Megaphone,
        schemeId: 'template-mod',
      },
    ],
  },
  {
    id: websiteShared.id,
    title: websiteShared.label,
    href: websiteShared.href,
    iconKey: websiteShared.iconKey,
    activeMatchRules: websiteShared.activeMatchRules,
    icon: Globe,
    position: 'left',
    schemeId: 'website',
    dropdown: [
      {
        id: 'website-home',
        title: 'Analytics',
        href: '/website',
        icon: ChartLine,
        schemeId: 'website',
      },
      {
        id: 'website-updates',
        title: 'Updates',
        href: '/website/updates',
        icon: Megaphone,
        schemeId: 'website',
      },
    ],
  },
  {
    id: toolsShared.id,
    title: toolsShared.label,
    href: toolsShared.href,
    iconKey: toolsShared.iconKey,
    activeMatchRules: toolsShared.activeMatchRules,
    icon: Wrench,
    position: 'left',
    schemeId: 'tools',
    dropdown: [
      {
        id: 'tools-playground',
        title: 'Playground',
        href: '/tools/md-playground',
        icon: FileCode2,
        schemeId: 'tools',
      },
    ],
  },
  {
    id: communityShared.id,
    title: communityShared.label,
    href: communityShared.href,
    iconKey: communityShared.iconKey,
    activeMatchRules: communityShared.activeMatchRules,
    icon: HeartHandshake,
    position: 'right',
    dropdown: [
      {
        id: 'credits',
        title: 'Credits',
        href: '/credits',
        activeMatchPaths: ['/credits'],
        icon: Users,
      },
      {
        id: 'license',
        title: 'License',
        href: '/license',
        activeMatchPaths: ['/license'],
        icon: Scale,
      },
      {
        id: 'contribute',
        title: 'Contribute',
        href: '/contribute',
        activeMatchPaths: ['/contribute'],
        icon: Heart,
      },
    ],
  },
  {
    id: discordShared.id,
    title: discordShared.label,
    href: discordShared.href,
    iconKey: discordShared.iconKey,
    activeMatchRules: discordShared.activeMatchRules,
    icon: 'discord',
    position: 'right',
    dropdown: [
      {
        id: 'subway-builder',
        title: 'Subway Builder',
        href: 'https://discord.gg/jrNQpbytUQ',
        icon: 'subway-builder',
      },
      {
        id: 'subway-builder-modded',
        title: 'Subway Builder Modded',
        href: 'https://discord.gg/syG9YHMyeG',
        icon: TrainTrack,
      },
    ],
  },
  {
    id: githubShared.id,
    title: githubShared.label,
    href: githubShared.href,
    iconKey: githubShared.iconKey,
    activeMatchRules: githubShared.activeMatchRules,
    icon: 'github',
    position: 'right',
    dropdown: [
      {
        id: 'github-railyard',
        title: 'Railyard',
        href: 'https://github.com/Subway-Builder-Modded/monorepo',
        icon: TrainTrack,
        schemeId: 'railyard',
      },
      {
        id: 'github-registry',
        title: 'Registry',
        href: 'https://github.com/Subway-Builder-Modded/registry',
        icon: Database,
        schemeId: 'registry',
      },
      {
        id: 'github-template-mod',
        title: 'Template Mod',
        href: 'https://github.com/Subway-Builder-Modded/template-mod',
        icon: Package,
        schemeId: 'template-mod',
      },
      {
        id: 'github-website',
        title: 'Website',
        href: 'https://github.com/Subway-Builder-Modded/website',
        icon: Globe,
        schemeId: 'website',
      },
    ],
  },
  {
    id: themeShared.id,
    title: themeShared.label,
    href: themeShared.href,
    iconKey: themeShared.iconKey,
    activeMatchRules: themeShared.activeMatchRules,
    icon: SunMoon,
    position: 'right',
    dropdown: [
      {
        id: 'theme-light',
        title: 'Light',
        icon: Sun,
        schemeId: 'themeLight',
        action: { type: 'theme', theme: 'light' },
      },
      {
        id: 'theme-dark',
        title: 'Dark',
        icon: Moon,
        schemeId: 'themeDark',
        action: { type: 'theme', theme: 'dark' },
      },
      {
        id: 'theme-system',
        title: 'System',
        icon: SunMoon,
        schemeId: 'themeSystem',
        action: { type: 'theme', theme: 'system' },
      },
    ],
  },
];

export const APP_NAVBAR_CONFIG: AppNavbarConfig = {
  brand: APP_NAVBAR_BRAND,
  sizes: APP_NAVBAR_SIZES,
  layout: {
    mobileQuickItemIds: WEBSITE_SHARED_NAVBAR_MODEL.mobileQuickActionIds ?? [
      'discord',
      'github',
      'theme',
    ],
    rightItemIconScale: 1,
  },
  items: APP_NAVBAR_ITEMS,
};
