import type { ModeHex, ProjectColorId } from '@/config/theme/contracts';
export type { ModeHex, ProjectColorId } from '@/config/theme/contracts';

export type ThemedColorSetBase = {
  accentColor: ModeHex;
  mutedColor: ModeHex;
  primaryColor: ModeHex;
  secondaryColor: ModeHex;
};

export type ThemedColorSet = ThemedColorSetBase & {
  textColor: ModeHex;
  textColorInverted: ModeHex;
};

export function getModeHex(value: ModeHex, isDark: boolean) {
  return isDark ? value.dark : value.light;
}

export const SHARED_TEXT_COLOR: ModeHex = {
  light: '#232323',
  dark: '#F2F2F2',
};

export const SHARED_TEXT_COLOR_INVERTED: ModeHex = {
  light: '#F2F2F2',
  dark: '#232323',
};

export const SHARED_MUTED_TEXT_COLOR: ModeHex = {
  light: '#737373',
  dark: '#9E9E9E',
};

type Rgb = { r: number; g: number; b: number };
type Rgba = Rgb & { a?: number };

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function clamp255(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function parseHexToRgba(hex: string): Rgba {
  const normalized = hex.trim().replace(/^#/, '');

  if (normalized.length !== 6 && normalized.length !== 8) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const a =
    normalized.length === 8
      ? Number.parseInt(normalized.slice(6, 8), 16) / 255
      : undefined;

  return { r, g, b, a };
}

function toHex(value: number) {
  return clamp255(value).toString(16).padStart(2, '0').toUpperCase();
}

function rgbaToHex({ r, g, b, a }: Rgba) {
  const rgbHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (typeof a !== 'number') return rgbHex;
  return `${rgbHex}${toHex(clamp01(a) * 255)}`;
}

function rgbToHsl({ r, g, b }: Rgb) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === red) {
      h = ((green - blue) / delta) % 6;
    } else if (max === green) {
      h = (blue - red) / delta + 2;
    } else {
      h = (red - green) / delta + 4;
    }
  }

  const hue = (h * 60 + 360) % 360;
  return { h: hue, s, l };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    r: clamp255((red + m) * 255),
    g: clamp255((green + m) * 255),
    b: clamp255((blue + m) * 255),
  };
}

type VibrantLightDeriveOptions = {
  saturationBoost?: number;
  lightnessBase?: number;
  saturationLightnessFactor?: number;
};

function deriveLightHexFromDarkVibrant(
  darkHex: string,
  options: VibrantLightDeriveOptions = {},
) {
  const darkRgba = parseHexToRgba(darkHex);
  const darkRgb = { r: darkRgba.r, g: darkRgba.g, b: darkRgba.b };
  const { h, s } = rgbToHsl(darkRgb);

  const saturationBoost = options.saturationBoost ?? 1.4;
  const lightnessBase = options.lightnessBase ?? 0.48;
  const saturationLightnessFactor = options.saturationLightnessFactor ?? 0.03;

  const targetSaturation = clamp01(s * saturationBoost);
  const targetLightness = clamp01(
    lightnessBase - targetSaturation * saturationLightnessFactor,
  );

  const lightCandidate = hslToRgb(h, targetSaturation, targetLightness);
  return rgbaToHex({ ...lightCandidate, a: darkRgba.a });
}

function createModeColorFromDarkAccent(darkHex: string): ModeHex {
  return {
    dark: darkHex,
    light: deriveLightHexFromDarkVibrant(darkHex, {
      saturationBoost: 1.34,
      lightnessBase: 0.46,
      saturationLightnessFactor: 0.028,
    }),
  };
}

function createModeColorFromDarkVibrant(darkHex: string): ModeHex {
  return {
    dark: darkHex,
    light: deriveLightHexFromDarkVibrant(darkHex),
  };
}

function withSharedTextColors(colors: ThemedColorSetBase): ThemedColorSet {
  return {
    ...colors,
    textColor: SHARED_TEXT_COLOR,
    textColorInverted: SHARED_TEXT_COLOR_INVERTED,
  };
}

export const PROJECT_COLOR_SCHEMES: Record<ProjectColorId, ThemedColorSet> = {
  railyard: withSharedTextColors({
    accentColor: { light: '#0F8F68', dark: '#19D89C' },
    mutedColor: { light: '#2C6E58', dark: '#2C6E58' },
    primaryColor: { light: '#0F8F6855', dark: '#42AD7F55' },
    secondaryColor: { light: '#1EA77D55', dark: '#19D89C55' },
  }),
  registry: withSharedTextColors({
    accentColor: createModeColorFromDarkAccent('#C77DFF'),
    mutedColor: createModeColorFromDarkVibrant('#9D4EDD'),
    primaryColor: createModeColorFromDarkVibrant('#9D4EDD55'),
    secondaryColor: createModeColorFromDarkVibrant('#C77DFF55'),
  }),
  'template-mod': withSharedTextColors({
    accentColor: createModeColorFromDarkAccent('#93C5FD'),
    mutedColor: createModeColorFromDarkVibrant('#3E6FA8'),
    primaryColor: createModeColorFromDarkVibrant('#60A5FA55'),
    secondaryColor: createModeColorFromDarkVibrant('#93C5FD55'),
  }),
  website: withSharedTextColors({
    accentColor: createModeColorFromDarkAccent('#FFBE73'),
    mutedColor: createModeColorFromDarkVibrant('#F2992E'),
    primaryColor: createModeColorFromDarkVibrant('#F2992E55'),
    secondaryColor: createModeColorFromDarkVibrant('#FFBE7355'),
  }),
  tools: withSharedTextColors({
    accentColor: createModeColorFromDarkAccent('#FF6B6B'),
    mutedColor: createModeColorFromDarkVibrant('#D94F4F'),
    primaryColor: createModeColorFromDarkVibrant('#D94F4F55'),
    secondaryColor: createModeColorFromDarkVibrant('#FF6B6B55'),
  }),
};
