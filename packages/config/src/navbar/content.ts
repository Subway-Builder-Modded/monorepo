import type { SharedNavbarModel } from './types';

export const WEBSITE_SHARED_NAVBAR_MODEL: SharedNavbarModel = {
  brand: {
    title: 'Subway Builder Modded',
    href: '/',
    iconKey: 'logo',
  },
  sections: [
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          id: 'railyard',
          label: 'Railyard',
          href: '/railyard',
          iconKey: 'railyard',
          activeMatchRules: [{ kind: 'prefix', path: '/railyard' }],
        },
        {
          id: 'registry',
          label: 'Registry',
          href: '/registry',
          iconKey: 'registry',
          activeMatchRules: [{ kind: 'prefix', path: '/registry' }],
        },
        {
          id: 'template-mod',
          label: 'Template Mod',
          href: '/template-mod',
          iconKey: 'template-mod',
          activeMatchRules: [{ kind: 'prefix', path: '/template-mod' }],
        },
        {
          id: 'website',
          label: 'Website',
          href: '/website',
          iconKey: 'website',
          activeMatchRules: [{ kind: 'prefix', path: '/website' }],
        },
        {
          id: 'tools',
          label: 'Tools',
          href: '/tools/md-playground',
          iconKey: 'tools',
          activeMatchRules: [{ kind: 'prefix', path: '/tools' }],
        },
      ],
    },
    {
      id: 'actions',
      label: 'Actions',
      items: [
        {
          id: 'community',
          href: 'https://discord.gg/syG9YHMyeG',
          iconKey: 'community',
        },
        {
          id: 'discord',
          href: 'https://discord.gg/syG9YHMyeG',
          iconKey: 'discord',
        },
        {
          id: 'github',
          href: 'https://github.com/Subway-Builder-Modded',
          iconKey: 'github',
        },
        {
          id: 'theme',
          iconKey: 'theme',
          children: [
            {
              id: 'theme-light',
              label: 'Light',
              iconKey: 'theme-light',
              action: { type: 'theme', theme: 'light' },
            },
            {
              id: 'theme-dark',
              label: 'Dark',
              iconKey: 'theme-dark',
              action: { type: 'theme', theme: 'dark' },
            },
            {
              id: 'theme-system',
              label: 'System',
              iconKey: 'theme-system',
              action: { type: 'theme', theme: 'system' },
            },
          ],
        },
      ],
    },
  ],
  mobileQuickActionIds: ['discord', 'github', 'theme'],
};

export const RAILYARD_SHARED_NAVBAR_MODEL: SharedNavbarModel = {
  brand: {
    title: 'Railyard',
    href: '/',
    iconKey: 'railyard',
  },
  sections: [
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          id: 'browse',
          label: 'Browse',
          href: '/browse',
          iconKey: 'browse',
          activeMatchRules: [
            { kind: 'prefix', path: '/browse' },
            { kind: 'prefix', path: '/search' },
            { kind: 'prefix', path: '/project' },
          ],
        },
        {
          id: 'library',
          label: 'Library',
          href: '/library',
          iconKey: 'library',
          activeMatchRules: [{ kind: 'prefix', path: '/library' }],
        },
        {
          id: 'profiles',
          label: 'Profiles',
          href: '/profiles',
          iconKey: 'profiles',
          activeMatchRules: [{ kind: 'prefix', path: '/profiles' }],
        },
        {
          id: 'logs',
          label: 'Logs',
          href: '/logs',
          iconKey: 'logs',
          activeMatchRules: [{ kind: 'prefix', path: '/logs' }],
        },
        {
          id: 'settings',
          label: 'Settings',
          href: '/settings',
          iconKey: 'settings',
          activeMatchRules: [{ kind: 'prefix', path: '/settings' }],
        },
      ],
    },
  ],
};
