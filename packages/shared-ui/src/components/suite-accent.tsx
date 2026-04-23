import * as React from 'react';
import { Slot } from 'radix-ui';
import { cn } from '../lib/cn';

export type SuiteAccent = {
  light: string;
  dark: string;
};

type SuiteAccentStyle = React.CSSProperties & {
  '--suite-accent-light'?: string;
  '--suite-accent-dark'?: string;
};

export function getSuiteAccentStyle(accent?: SuiteAccent): SuiteAccentStyle | undefined {
  if (!accent) {
    return undefined;
  }

  return {
    '--suite-accent-light': accent.light,
    '--suite-accent-dark': accent.dark,
  };
}

export const SUITE_ACCENT_TEXT_CLASS =
  'text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]';

export type SuiteAccentScopeProps = React.ComponentProps<'div'> & {
  accent?: SuiteAccent;
};

export function SuiteAccentScope({ accent, className, style, ...props }: SuiteAccentScopeProps) {
  return (
    <div
      className={cn('[--suite-accent-light:var(--primary)] [--suite-accent-dark:var(--primary)]', className)}
      style={{ ...getSuiteAccentStyle(accent), ...style }}
      {...props}
    />
  );
}

export type SuiteAccentLinkProps = React.ComponentProps<'a'> & {
  accent?: SuiteAccent;
  asChild?: boolean;
};

export function SuiteAccentLink({ accent, asChild = false, className, style, ...props }: SuiteAccentLinkProps) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      className={cn(
        'inline-flex items-center gap-1 font-medium underline decoration-[color-mix(in_srgb,var(--suite-accent-light)_35%,transparent)] underline-offset-4',
        'dark:decoration-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)]',
        SUITE_ACCENT_TEXT_CLASS,
        'hover:text-[color-mix(in_srgb,var(--suite-accent-light)_82%,black)] hover:decoration-[color-mix(in_srgb,var(--suite-accent-light)_58%,transparent)]',
        'dark:hover:text-[color-mix(in_srgb,var(--suite-accent-dark)_84%,white)] dark:hover:decoration-[color-mix(in_srgb,var(--suite-accent-dark)_58%,transparent)]',
        'focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--suite-accent-light)_36%,transparent)] dark:focus-visible:ring-[color-mix(in_srgb,var(--suite-accent-dark)_42%,transparent)]',
        'active:translate-y-[0.5px] transition-[color,text-decoration-color,transform]',
        className,
      )}
      style={{ ...getSuiteAccentStyle(accent), ...style }}
      {...props}
    />
  );
}

export type SuiteAccentButtonTone = 'solid' | 'outline' | 'ghost';

export type SuiteAccentButtonProps = React.ComponentProps<'button'> & {
  accent?: SuiteAccent;
  tone?: SuiteAccentButtonTone;
  asChild?: boolean;
};

export function SuiteAccentButton({
  accent,
  tone = 'solid',
  asChild = false,
  className,
  style,
  ...props
}: SuiteAccentButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold',
        'transition-[background-color,border-color,color,box-shadow,transform]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--suite-accent-light)_34%,transparent)] dark:focus-visible:ring-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)]',
        'active:translate-y-[0.5px] disabled:pointer-events-none disabled:opacity-50',
        tone === 'solid' &&
          'border-transparent bg-[var(--suite-accent-light)] text-background hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_86%,white)] dark:bg-[var(--suite-accent-dark)] dark:text-background dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_90%,white)]',
        tone === 'outline' &&
          'border-[color-mix(in_srgb,var(--suite-accent-light)_34%,transparent)] text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]',
        tone === 'ghost' &&
          'border-transparent text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)]',
        className,
      )}
      style={{ ...getSuiteAccentStyle(accent), ...style }}
      {...props}
    />
  );
}

export type SuiteAccentInlineActionProps = React.ComponentProps<'button'> & {
  accent?: SuiteAccent;
};

export function SuiteAccentInlineAction({
  accent,
  className,
  style,
  type = 'button',
  ...props
}: SuiteAccentInlineActionProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2 text-xs font-semibold',
        SUITE_ACCENT_TEXT_CLASS,
        'hover:border-[color-mix(in_srgb,var(--suite-accent-light)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)]',
        'dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--suite-accent-light)_34%,transparent)] dark:focus-visible:ring-[color-mix(in_srgb,var(--suite-accent-dark)_40%,transparent)]',
        'transition-[background-color,border-color,color]',
        className,
      )}
      style={{ ...getSuiteAccentStyle(accent), ...style }}
      {...props}
    />
  );
}
