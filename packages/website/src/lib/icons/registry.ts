import type { AssetIconDefinition } from '@/lib/icons/types';

export const APP_ICON_REGISTRY = {
  logo: { type: 'image', src: '/logo.png' },
  discord: { type: 'mask', src: '/assets/discord.svg' },
  github: { type: 'mask', src: '/assets/github.svg' },
  subwayBuilder: { type: 'image', src: '/assets/subway-builder.svg' },
} as const satisfies Record<string, AssetIconDefinition>;

export type AppIconRegistryName = keyof typeof APP_ICON_REGISTRY;

export const APP_ICON_ALIASES: Record<string, AppIconRegistryName> = {
  'sbm-logo': 'logo',
  sbmLogo: 'logo',
  sbm_logo: 'logo',
  'discord-mask': 'discord',
  discordMask: 'discord',
  discord_mask: 'discord',
  'github-mask': 'github',
  githubMask: 'github',
  github_mask: 'github',
  'subway-builder': 'subwayBuilder',
  subway_builder: 'subwayBuilder',
  subwaybuilder: 'subwayBuilder',
};
