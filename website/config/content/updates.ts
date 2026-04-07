import { Globe, Package, TrainTrack, type LucideIcon } from 'lucide-react';
import { PROJECT_COLOR_SCHEMES, type ModeHex } from '@/config/theme/colors';

export type UpdateProjectId = 'railyard' | 'template-mod' | 'website';

export type UpdateProject = {
  id: UpdateProjectId;
  label: string;
  description: string;
  currentVersion: string;
  basePath: string;
  icon: LucideIcon;
  accentColor: ModeHex;
  primaryColor: ModeHex;
  secondaryColor: ModeHex;
  textColor: ModeHex;
  textColorInverted: ModeHex;
};

export const UPDATE_PROJECTS: UpdateProject[] = [
  {
    id: 'railyard',
    label: 'Railyard',
    description: 'All-in-one Map and Mod Manager for Subway Builder.',
    currentVersion: 'v0.2.1',
    basePath: '/railyard/updates',
    icon: TrainTrack,
    accentColor: PROJECT_COLOR_SCHEMES.railyard.accentColor,
    primaryColor: PROJECT_COLOR_SCHEMES.railyard.primaryColor,
    secondaryColor: PROJECT_COLOR_SCHEMES.railyard.secondaryColor,
    textColor: PROJECT_COLOR_SCHEMES.railyard.textColor,
    textColorInverted: PROJECT_COLOR_SCHEMES['template-mod'].textColorInverted,
  },
  {
    id: 'template-mod',
    label: 'Template Mod',
    description:
      'The all-inclusive TypeScript template to create your own mods for Subway Builder.',
    currentVersion: 'v1.0.1',
    basePath: '/template-mod/updates',
    icon: Package,
    accentColor: PROJECT_COLOR_SCHEMES['template-mod'].accentColor,
    primaryColor: PROJECT_COLOR_SCHEMES['template-mod'].primaryColor,
    secondaryColor: PROJECT_COLOR_SCHEMES['template-mod'].secondaryColor,
    textColor: PROJECT_COLOR_SCHEMES['template-mod'].textColor,
    textColorInverted: PROJECT_COLOR_SCHEMES['template-mod'].textColorInverted,
  },
  {
    id: 'website',
    label: 'Website',
    description:
      'Release notes and changelogs for the Subway Builder Modded website.',
    currentVersion: 'v1.0.0',
    basePath: '/website/updates',
    icon: Globe,
    accentColor: PROJECT_COLOR_SCHEMES.website.accentColor,
    primaryColor: PROJECT_COLOR_SCHEMES.website.primaryColor,
    secondaryColor: PROJECT_COLOR_SCHEMES.website.secondaryColor,
    textColor: PROJECT_COLOR_SCHEMES.website.textColor,
    textColorInverted: PROJECT_COLOR_SCHEMES.website.textColorInverted,
  },
];

export function getUpdateProjectById(id: string): UpdateProject | undefined {
  return UPDATE_PROJECTS.find((project) => project.id === id);
}

export type UpdateTag = 'release' | 'beta' | 'alpha';
export type UpdateSectionType = 'features' | 'bugfixes' | 'upgrades' | 'other';

export const UPDATE_SECTION_CONFIG: Record<
  UpdateSectionType,
  { label: string }
> = {
  features: {
    label: 'Features',
  },
  bugfixes: {
    label: 'Bugfixes',
  },
  upgrades: {
    label: 'Upgrades & Changes',
  },
  other: {
    label: 'Other Notes',
  },
};
