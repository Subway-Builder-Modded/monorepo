import type { ModeHex } from '@/config/theme/contracts';

type ThemeSuiteColorRole =
  | 'accentColor'
  | 'primaryColor'
  | 'secondaryColor'
  | 'textColor'
  | 'textColorInverted';

const SUITE_VAR_MAP: Record<
  ThemeSuiteColorRole,
  { light: string; dark: string }
> = {
  accentColor: {
    light: 'var(--suite-accent-light)',
    dark: 'var(--suite-accent-dark)',
  },
  primaryColor: {
    light: 'var(--suite-primary-light)',
    dark: 'var(--suite-primary-dark)',
  },
  secondaryColor: {
    light: 'var(--suite-secondary-light)',
    dark: 'var(--suite-secondary-dark)',
  },
  textColor: {
    light: 'var(--suite-text-light)',
    dark: 'var(--suite-text-dark)',
  },
  textColorInverted: {
    light: 'var(--suite-text-inverted-light)',
    dark: 'var(--suite-text-inverted-dark)',
  },
};

export type { ThemeSuiteColorRole };

export function getSuiteColorVarRefs(role: ThemeSuiteColorRole): ModeHex {
  return SUITE_VAR_MAP[role];
}
