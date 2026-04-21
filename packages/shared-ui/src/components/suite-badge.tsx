import { Slot } from 'radix-ui';
import * as React from 'react';
import { cn } from '../lib/cn';
import { getSuiteAccentStyle, type SuiteAccent } from './suite-accent';

export type SuiteBadgeTone = 'soft' | 'outline' | 'solid' | 'neutral';
export type SuiteBadgeSize = 'sm' | 'md';

export type SuiteBadgeProps = React.ComponentProps<'span'> & {
  accent?: SuiteAccent;
  tone?: SuiteBadgeTone;
  size?: SuiteBadgeSize;
  asChild?: boolean;
};

export function SuiteBadge({
  accent,
  tone = 'soft',
  size = 'md',
  asChild = false,
  className,
  style,
  ...props
}: SuiteBadgeProps) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="suite-badge"
      data-tone={tone}
      data-size={size}
      className={cn(
        'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border font-semibold uppercase tracking-[0.06em]',
        // Add a small top nudge so text sits visually centered within the badge
        // and descenders on letters like y/g/j have space at the bottom.
        'leading-[1.15] pt-px',
        size === 'sm' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2.5 text-[11px]',
        tone === 'soft' &&
          'border-[color-mix(in_srgb,var(--suite-accent-light)_28%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_34%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)] dark:text-[var(--suite-accent-dark)]',
        tone === 'outline' &&
          'border-[color-mix(in_srgb,var(--suite-accent-light)_38%,transparent)] bg-transparent text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_44%,transparent)] dark:text-[var(--suite-accent-dark)]',
        tone === 'solid' &&
          'border-transparent bg-[var(--suite-accent-light)] text-background dark:bg-[var(--suite-accent-dark)] dark:text-background',
        tone === 'neutral' && 'border-border/70 bg-muted/45 text-muted-foreground',
        className,
      )}
      style={{ ...getSuiteAccentStyle(accent), ...style }}
      {...props}
    />
  );
}

export type SuiteStatus = 'latest' | 'deprecated';

export type SuiteStatusChipProps = Omit<SuiteBadgeProps, 'children' | 'tone'> & {
  status: SuiteStatus;
  label?: string;
  deprecatedTone?: 'suite' | 'gray';
};

export function SuiteStatusChip({
  status,
  label,
  deprecatedTone = 'suite',
  className,
  ...props
}: SuiteStatusChipProps) {
  if (status === 'deprecated' && deprecatedTone === 'gray') {
    return (
      <SuiteBadge
        tone="neutral"
        className={cn('text-[10px]', className)}
        {...props}
      >
        {label ?? 'DEPRECATED'}
      </SuiteBadge>
    );
  }

  return (
    <SuiteBadge tone="soft" className={cn('text-[10px]', className)} {...props}>
      {label ?? (status === 'latest' ? 'LATEST' : 'DEPRECATED')}
    </SuiteBadge>
  );
}
