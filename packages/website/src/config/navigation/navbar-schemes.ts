import { PROJECT_COLOR_SCHEMES } from '@/config/theme/colors';
import type { NavbarColorScheme } from '@/config/navigation/navbar.types';

function getProjectNavbarScheme(
  project: keyof typeof PROJECT_COLOR_SCHEMES,
): NavbarColorScheme {
  const scheme = PROJECT_COLOR_SCHEMES[project];

  const withAlpha = (hex: string, alphaHex: string) => {
    const normalized = hex.trim().replace(/^#/, '');
    if (normalized.length === 6) return `#${normalized}${alphaHex}`;
    if (normalized.length === 8) return `#${normalized.slice(0, 6)}${alphaHex}`;
    return hex;
  };

  return {
    hover: {
      light: {
        text: scheme.accentColor.light,
        background: withAlpha(scheme.primaryColor.light, '26'),
      },
      dark: {
        text: scheme.accentColor.dark,
        background: withAlpha(scheme.primaryColor.dark, '33'),
      },
    },
    active: {
      light: {
        text: scheme.accentColor.light,
        background: withAlpha(scheme.primaryColor.light, '33'),
      },
      dark: {
        text: scheme.accentColor.dark,
        background: withAlpha(scheme.primaryColor.dark, '40'),
      },
    },
    indicator: {
      light: scheme.accentColor.light,
      dark: scheme.accentColor.dark,
    },
  };
}

export const APP_NAVBAR_COLOR_SCHEMES = {
  railyard: getProjectNavbarScheme('railyard'),
  registry: getProjectNavbarScheme('registry'),
  'template-mod': getProjectNavbarScheme('template-mod'),
  website: getProjectNavbarScheme('website'),
  tools: getProjectNavbarScheme('tools'),
  themeLight: {
    hover: {
      light: { text: '#B06710', background: '#FFD26055' },
      dark: { text: '#FFD260', background: '#B0671055' },
    },
    active: {
      light: { text: '#B06710', background: '#FFD26055' },
      dark: { text: '#FFD260', background: '#B0671055' },
    },
    indicator: { light: '#B06710', dark: '#FFD260' },
  },
  themeDark: {
    hover: {
      light: { text: '#4776CC', background: '#2DB7E055' },
      dark: { text: '#2DB7E0', background: '#4776CC55' },
    },
    active: {
      light: { text: '#4776CC', background: '#2DB7E055' },
      dark: { text: '#2DB7E0', background: '#4776CC55' },
    },
    indicator: { light: '#4776CC', dark: '#2DB7E0' },
  },
  themeSystem: {
    hover: {
      light: { text: '#B06710', background: '#FFD26055' },
      dark: { text: '#2DB7E0', background: '#4776CC55' },
    },
    active: {
      light: { text: '#B06710', background: '#FFD26055' },
      dark: { text: '#2DB7E0', background: '#4776CC55' },
    },
    indicator: { light: '#B06710', dark: '#2DB7E0' },
  },
} as const satisfies Record<string, NavbarColorScheme>;

export type NavbarColorSchemeId = keyof typeof APP_NAVBAR_COLOR_SCHEMES;
