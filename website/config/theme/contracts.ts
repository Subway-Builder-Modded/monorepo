export const PROJECT_COLOR_IDS = [
  'railyard',
  'registry',
  'template-mod',
  'website',
  'tools',
] as const;

export type ProjectColorId = (typeof PROJECT_COLOR_IDS)[number];

export type ModeHex = {
  light: string;
  dark: string;
};

export const SITE_COLOR_SCHEME_IDS = ['default', ...PROJECT_COLOR_IDS] as const;

export type SiteColorSchemeId = (typeof SITE_COLOR_SCHEME_IDS)[number];

export function isProjectColorId(value: string): value is ProjectColorId {
  return PROJECT_COLOR_IDS.includes(value as ProjectColorId);
}
