import { PROJECT_COLOR_SCHEMES, type ModeHex } from '@/config/theme/colors';

export type LineBulletThemeId = 'default' | 'railyard' | 'template-mod';
export type LineBulletColorRole =
  | 'accentColor'
  | 'primaryColor'
  | 'secondaryColor';
export type LineBulletTextRole = 'textColor' | 'textColorInverted';
export type LineBulletShape = 'circle' | 'diamond' | 'triangle';
export type LineBulletSize = 'sm' | 'md' | 'lg' | 'xl';

export type LineBulletThemePalette = {
  accentColor: ModeHex;
  primaryColor: ModeHex;
  secondaryColor: ModeHex;
  textColor: ModeHex;
  textColorInverted: ModeHex;
};

export type LineBulletPreset = {
  shape?: LineBulletShape;
  size?: LineBulletSize;
  colorRole?: LineBulletColorRole;
  textRole?: LineBulletTextRole;
  hoverColorRole?: LineBulletColorRole;
  invertOnHover?: boolean;
};

export const LINE_BULLET_THEMES: Record<
  LineBulletThemeId,
  LineBulletThemePalette
> = {
  default: {
    accentColor: { light: '#000000', dark: '#FFFFFF' },
    primaryColor: { light: '#1F2937', dark: '#E5E7EB' },
    secondaryColor: { light: '#111827', dark: '#F3F4F6' },
    textColor: { light: '#F2F2F2', dark: '#232323' },
    textColorInverted: { light: '#F2F2F2', dark: '#232323' },
  },
  railyard: PROJECT_COLOR_SCHEMES.railyard,
  'template-mod': PROJECT_COLOR_SCHEMES['template-mod'],
};

export const LINE_BULLET_PRESETS: Record<string, LineBulletPreset> = {
  title: {
    shape: 'circle',
    size: 'sm',
    colorRole: 'accentColor',
    textRole: 'textColorInverted',
  },
  'hub-title': {
    shape: 'circle',
    size: 'md',
    colorRole: 'secondaryColor',
    textRole: 'textColor',
  },
  'railyard-feature': {
    shape: 'circle',
    size: 'md',
    colorRole: 'accentColor',
    textRole: 'textColor',
    hoverColorRole: 'accentColor',
  },
  'railyard-workflow': {
    shape: 'circle',
    size: 'sm',
    colorRole: 'accentColor',
    textRole: 'textColor',
    hoverColorRole: 'accentColor',
  },
  'route-chip': {
    shape: 'circle',
    size: 'sm',
    invertOnHover: true,
    textRole: 'textColorInverted',
  },
};

function modeHexOrFallback(
  value: ModeHex | undefined,
  fallback: ModeHex,
): ModeHex {
  return value ?? fallback;
}

export function getLineBulletTheme(
  themeId?: string | null,
): LineBulletThemePalette {
  if (!themeId) return LINE_BULLET_THEMES.default;
  if (themeId in LINE_BULLET_THEMES) {
    return LINE_BULLET_THEMES[themeId as LineBulletThemeId];
  }
  return LINE_BULLET_THEMES.default;
}

export function getLineBulletPreset(preset?: string | null): LineBulletPreset {
  if (!preset) return {};
  return LINE_BULLET_PRESETS[preset] ?? {};
}

export function resolveLineBulletModeHex(
  themeId: string | null | undefined,
  colorRole: LineBulletColorRole,
  override?: Partial<ModeHex>,
) {
  const theme = getLineBulletTheme(themeId);
  const base = theme[colorRole];
  return {
    light: override?.light ?? base.light,
    dark: override?.dark ?? base.dark,
  };
}

export function resolveLineBulletTextModeHex(
  themeId: string | null | undefined,
  textRole: LineBulletTextRole,
  override?: Partial<ModeHex>,
) {
  const theme = getLineBulletTheme(themeId);
  const base = theme[textRole];
  return {
    light: override?.light ?? base.light,
    dark: override?.dark ?? base.dark,
  };
}

export function resolveLineBulletHoverModeHex(
  themeId: string | null | undefined,
  colorRole: LineBulletColorRole,
  hoverColorRole?: LineBulletColorRole,
  override?: Partial<ModeHex>,
) {
  const theme = getLineBulletTheme(themeId);
  const base = theme[hoverColorRole ?? colorRole];
  const fallback = modeHexOrFallback(base, theme[colorRole]);
  return {
    light: override?.light ?? fallback.light,
    dark: override?.dark ?? fallback.dark,
  };
}
