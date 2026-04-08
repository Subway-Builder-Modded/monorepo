import {
  Archive,
  Atom,
  BookText,
  Bug,
  CodeXml,
  Folder,
  Link2,
  Package,
  Plus,
  SearchCode,
  Tag,
  TrainTrack,
  Users,
} from 'lucide-react';
import type { DocsInstance } from '@/config/content/docs.types';

export const DOCS_INSTANCES: DocsInstance[] = [
  {
    id: 'railyard',
    label: 'Railyard',
    basePath: '/railyard/docs',
    icon: TrainTrack,
    sidebarHeader: {
      icon: BookText,
    },
    versioned: true,
    latestVersion: 'v0.2',
    versions: [
      {
        value: 'v0.2',
        label: 'v0.2',
        icon: Tag,
        sidebarOrder: [
          {
            key: 'players',
            children: [
              {
                key: 'installing-railyard',
                children: ['windows', 'macos', 'linux'],
              },
              'github-token',
              'country-flag-emojis',
              'importing-custom-assets',
              'profile-management',
            ],
          },
          {
            key: 'developers',
            children: [
              'publishing-projects',
              'using-custom-url',
              'tagging',
              'data-quality',
              'dependencies',
            ],
          },
        ],
      },
      {
        value: 'v0.1',
        label: 'v0.1',
        icon: Archive,
        deprecated: true,
        sidebarOrder: [
          {
            key: 'players',
            children: [
              'install-guide-windows',
              'install-guide-macos',
              'install-guide-linux',
              'github-token',
            ],
          },
          {
            key: 'developers',
            children: [
              'publishing-projects',
              'using-custom-url',
              'data-quality',
            ],
          },
        ],
      },
    ],
    hub: {
      description: 'All-in-one Map and Mod Manager for Subway Builder.',
      cards: [
        {
          title: 'Players',
          description:
            'The guide for players getting started with Railyard, including installation, setup, and configuration.',
          icon: Users,
          docPath: 'players',
        },
        {
          title: 'Developers',
          description:
            'Learn exactly how to make your project compatible with Railyard and how to submit it to the registry.',
          icon: CodeXml,
          docPath: 'developers',
        },
      ],
    },
  },
  {
    id: 'template-mod',
    label: 'Template Mod',
    basePath: '/template-mod/docs',
    icon: Package,
    sidebarHeader: {
      icon: BookText,
    },
    versioned: true,
    latestVersion: 'v1.0',
    versions: [
      {
        value: 'v1.0',
        label: 'v1.0',
        icon: Tag,
        sidebarOrder: [
          'getting-started',
          'project-structure',
          'common-patterns',
          'react-components',
          'debugging',
          'type-reference',
        ],
      },
    ],
    hub: {
      description:
        'The all-inclusive TypeScript template to create your own mods for Subway Builder.',
      cards: [
        {
          title: 'Getting Started',
          description:
            'Get started with the Subway Builder Modded Template Mod.',
          icon: Plus,
          docPath: 'getting-started',
        },
        {
          title: 'Project Structure',
          description:
            'Learn how to organize your project when creating a custom mod.',
          icon: Folder,
          docPath: 'project-structure',
        },
        {
          title: 'Common Patterns',
          description: 'Learn about common patterns that may be useful.',
          icon: Link2,
          docPath: 'common-patterns',
        },
        {
          title: 'React Components',
          description:
            'Learn about the various React components that are available for you to use.',
          icon: Atom,
          docPath: 'react-components',
        },
        {
          title: 'Debugging',
          description: 'Learn how to properly debug and test your mod.',
          icon: Bug,
          docPath: 'debugging',
        },
        {
          title: 'Type Reference',
          description:
            "Organization of the template's full TypeScript type definitions for the Subway Builder Modding API.",
          icon: SearchCode,
          docPath: 'type-reference',
        },
      ],
    },
  },
];
