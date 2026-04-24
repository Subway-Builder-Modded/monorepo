import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { getSuiteAccentStyle, type SuiteAccent } from './suite-accent';

export type PageHeadingSize = 'default' | 'compact' | 'sidebar';

export interface PageHeadingProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  size?: PageHeadingSize;
  eyebrow?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  accent?: SuiteAccent;
  className?: string;
}

export function PageHeading({
  icon: Icon,
  title,
  description,
  size = 'default',
  eyebrow,
  badge,
  actions,
  footer,
  accent,
  className,
}: PageHeadingProps) {
  const isCompact = size === 'compact' || size === 'sidebar';
  const isSidebar = size === 'sidebar';

  return (
    <header className={cn('relative isolate mb-8', className)} style={getSuiteAccentStyle(accent)}>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 z-0 mx-auto rounded-full blur-3xl',
          isSidebar
            ? '-top-8 h-20 max-w-sm'
            : isCompact
              ? '-top-8 h-20 max-w-sm'
              : '-top-10 h-28 w-full',
          'bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_26%,transparent)] to-transparent dark:via-[color-mix(in_srgb,var(--suite-accent-dark)_30%,transparent)]',
        )}
      />

      <div
        className={cn(
          'relative z-10 rounded-2xl border border-border/65 bg-background/65 shadow-sm backdrop-blur-sm',
          isSidebar
            ? 'px-4 py-3'
            : isCompact
              ? 'px-4 py-3.5'
              : 'px-5 py-4 sm:px-6 sm:py-5',
        )}
      >
        <div className={cn('flex items-start gap-3', isSidebar ? 'gap-2.5' : 'gap-3.5')}>
          <span
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-[0.7rem] border',
              'border-[color-mix(in_srgb,var(--suite-accent-light)_28%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] text-[var(--suite-accent-light)]',
              'dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_34%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)] dark:text-[var(--suite-accent-dark)]',
              isSidebar ? 'mt-0.5 size-8 rounded-[0.62rem]' : isCompact ? 'mt-0.5 size-8.5' : 'size-10',
            )}
          >
            <Icon className={cn(isSidebar ? 'size-4' : isCompact ? 'size-4.5' : 'size-5')} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}

            <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1')}>
              <h1
                className={cn(
                  'font-black tracking-[-0.02em] text-foreground',
                  isSidebar
                    ? 'text-[1.85rem] leading-[1.1]'
                    : isCompact
                      ? 'text-2xl leading-tight'
                      : 'text-3xl leading-tight sm:text-4xl',
                )}
              >
                {title}
              </h1>
              {badge}
            </div>

            {description ? (
              <p
                className={cn(
                  'mt-1.5 text-muted-foreground',
                  isSidebar
                    ? 'max-w-2xl text-sm leading-relaxed'
                    : isCompact
                      ? 'max-w-xl text-sm leading-relaxed'
                      : 'max-w-3xl text-sm leading-relaxed sm:text-base',
                )}
              >
                {description}
              </p>
            ) : null}
          </div>

          {actions ? <div className="shrink-0 self-center">{actions}</div> : null}
        </div>

        {footer ? <div className="mt-3 border-t border-border/50 pt-3">{footer}</div> : null}
      </div>
    </header>
  );
}
