import type { CSSProperties, ReactNode } from 'react';

import { getSuiteColorVarRefs } from '@/config/theme/css-vars';
import type { ThemedColorSet } from '@/config/theme/colors';
import type { SiteColorSchemeId } from '@/config/theme/contracts';
import {
  PROJECT_COLOR_SCHEMES,
  SHARED_TEXT_COLOR,
  SHARED_TEXT_COLOR_INVERTED,
} from '@/config/theme/colors';
import { hexAlpha } from '@/lib/color';
import { cn } from '@/lib/utils';

type ThemedShowcaseCardVariant =
  | 'home'
  | 'hub'
  | 'docs'
  | 'credits'
  | 'version'
  | 'header';

type ModeHexLike = {
  light: string;
  dark: string;
};

export type ThemedShowcaseCardPalette = {
  accent: ModeHexLike;
  primary?: ModeHexLike;
  secondary?: ModeHexLike;
  text?: ModeHexLike;
  textInverted?: ModeHexLike;
};

type ThemedShowcaseCardProps = {
  variant?: ThemedShowcaseCardVariant;
  palette?: Partial<ThemedShowcaseCardPalette>;
  scheme?: Exclude<SiteColorSchemeId, 'default'>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

function isHexColor(value: string) {
  return /^#([a-f0-9]{6}|[a-f0-9]{8})$/i.test(value.trim());
}

function deriveAlpha(value: string, alpha: number, varFallback: string) {
  return isHexColor(value) ? hexAlpha(value, alpha) : varFallback;
}

function resolvePaletteFromScheme(
  scheme?: Exclude<SiteColorSchemeId, 'default'>,
): ThemedShowcaseCardPalette {
  if (!scheme) {
    return {
      accent: getSuiteColorVarRefs('accentColor'),
      primary: getSuiteColorVarRefs('primaryColor'),
      secondary: getSuiteColorVarRefs('secondaryColor'),
      text: getSuiteColorVarRefs('textColor'),
      textInverted: getSuiteColorVarRefs('textColorInverted'),
    };
  }

  const colors = PROJECT_COLOR_SCHEMES[scheme] as ThemedColorSet;
  return {
    accent: colors.accentColor,
    primary: colors.primaryColor,
    secondary: colors.secondaryColor,
    text: colors.textColor,
    textInverted: colors.textColorInverted,
  };
}

function getVariantClasses(variant: ThemedShowcaseCardVariant) {
  switch (variant) {
    case 'home':
      return {
        card: cn(
          'rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300',
          'hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-black/12 dark:hover:shadow-black/35',
        ),
        ring: 'rounded-2xl',
        topLine: 'h-0.5',
        spotA: '-right-16 -top-16 size-44 rounded-full blur-3xl',
        spotB: 'hidden',
        interactive: true,
      };
    case 'hub':
      return {
        card: cn(
          'rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300',
          'hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-black/12 dark:hover:shadow-black/35',
        ),
        ring: 'rounded-2xl',
        topLine: 'h-0.5',
        spotA: '-top-16 right-[-4.75rem] size-44 rounded-full blur-3xl',
        spotB: '-bottom-20 -left-10 size-40 rounded-full blur-3xl',
        interactive: true,
      };
    case 'docs':
      return {
        card: cn(
          'rounded-xl border border-border/70 bg-card/80 shadow-sm transition-all duration-300',
          'hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30',
        ),
        ring: 'rounded-xl',
        topLine: 'h-0.5',
        spotA: '-right-10 -top-10 size-24 rounded-full blur-2xl',
        spotB: 'hidden',
        interactive: true,
      };
    case 'credits':
      return {
        card: cn(
          'rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-300',
          'hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30',
        ),
        ring: 'rounded-xl',
        topLine: 'h-0.5',
        spotA: '-right-14 -top-14 size-28 rounded-full blur-2xl',
        spotB: 'hidden',
        interactive: true,
      };
    case 'version':
      return {
        card: cn(
          'rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-300',
          'hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30',
        ),
        ring: 'rounded-xl',
        topLine: 'h-full w-1 inset-y-0 left-0 rounded-l-xl',
        spotA: '-right-16 -top-20 size-40 rounded-full blur-3xl',
        spotB: 'hidden',
        interactive: true,
      };
    case 'header':
    default:
      return {
        card: 'rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6',
        ring: 'rounded-2xl',
        topLine: 'h-0.5',
        spotA: '-right-16 -top-20 size-40 rounded-full blur-3xl',
        spotB: 'hidden',
        interactive: false,
      };
  }
}

function buildCardVars(
  palette: ThemedShowcaseCardPalette,
  variant: ThemedShowcaseCardVariant,
): CSSProperties {
  const accent = palette.accent;
  const primary = palette.primary ?? palette.accent;
  const secondary = palette.secondary ?? palette.accent;
  const text = palette.text ?? SHARED_TEXT_COLOR;
  const textInverted = palette.textInverted ?? SHARED_TEXT_COLOR_INVERTED;

  const ringLightFallback =
    'color-mix(in srgb, var(--ts-card-accent-light) 38%, transparent)';
  const ringDarkFallback =
    'color-mix(in srgb, var(--ts-card-accent-dark) 45%, transparent)';
  const softLightFallback =
    'color-mix(in srgb, var(--ts-card-accent-light) 20%, transparent)';
  const softDarkFallback =
    'color-mix(in srgb, var(--ts-card-accent-dark) 24%, transparent)';

  return {
    ['--ts-card-accent-light' as string]: accent.light,
    ['--ts-card-accent-dark' as string]: accent.dark,
    ['--ts-card-primary-light' as string]: primary.light,
    ['--ts-card-primary-dark' as string]: primary.dark,
    ['--ts-card-secondary-light' as string]: secondary.light,
    ['--ts-card-secondary-dark' as string]: secondary.dark,
    ['--ts-card-text-light' as string]: text.light,
    ['--ts-card-text-dark' as string]: text.dark,
    ['--ts-card-text-inv-light' as string]: textInverted.light,
    ['--ts-card-text-inv-dark' as string]: textInverted.dark,
    ['--ts-card-ring-light' as string]: deriveAlpha(
      accent.light,
      0.38,
      ringLightFallback,
    ),
    ['--ts-card-ring-dark' as string]: deriveAlpha(
      accent.dark,
      0.45,
      ringDarkFallback,
    ),
    ['--ts-card-soft-light' as string]:
      variant === 'docs'
        ? deriveAlpha(accent.light, 0.17, softLightFallback)
        : deriveAlpha(accent.light, 0.2, softLightFallback),
    ['--ts-card-soft-dark' as string]:
      variant === 'docs'
        ? deriveAlpha(accent.dark, 0.24, softDarkFallback)
        : deriveAlpha(accent.dark, 0.24, softDarkFallback),
  };
}

export function ThemedShowcaseCard({
  variant = 'home',
  palette,
  scheme,
  className,
  style,
  children,
}: ThemedShowcaseCardProps) {
  const resolvedPalette = resolvePaletteFromScheme(scheme);
  const mergedPalette: ThemedShowcaseCardPalette = {
    ...resolvedPalette,
    ...palette,
    accent: palette?.accent ?? resolvedPalette.accent,
  };
  const variantClasses = getVariantClasses(variant);

  return (
    <article
      className={cn(
        'group relative overflow-hidden',
        variantClasses.card,
        className,
      )}
      style={{
        ...buildCardVars(mergedPalette, variant),
        ...style,
      }}
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-0 ring-1 ring-inset ring-[var(--ts-card-ring-light)] dark:ring-[var(--ts-card-ring-dark)]',
          variantClasses.interactive
            ? 'opacity-0 transition-opacity duration-300 group-hover:opacity-100'
            : 'opacity-0',
          variantClasses.ring,
        )}
      />
      <span
        className={cn(
          'absolute top-0 bg-[var(--ts-card-accent-light)] dark:bg-[var(--ts-card-accent-dark)]',
          variantClasses.topLine,
          variant === 'version' ? '' : 'inset-x-0',
        )}
      />
      <span
        className={cn(
          'pointer-events-none absolute bg-[var(--ts-card-soft-light)] dark:bg-[var(--ts-card-soft-dark)]',
          variantClasses.interactive
            ? 'opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100'
            : 'opacity-100',
          variantClasses.spotA,
        )}
      />
      {variantClasses.spotB !== 'hidden' ? (
        <span
          className={cn(
            'pointer-events-none absolute bg-[var(--ts-card-soft-light)] dark:bg-[var(--ts-card-soft-dark)]',
            variantClasses.interactive
              ? 'opacity-0 transition-opacity duration-300 group-hover:opacity-80'
              : 'opacity-0',
            variantClasses.spotB,
          )}
        />
      ) : null}
      {children}
    </article>
  );
}
