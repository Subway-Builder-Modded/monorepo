import * as React from 'react';

import {
  UPDATE_SECTION_CONFIG,
  type UpdateSectionType,
} from '@/config/content/updates';
import { PROJECT_COLOR_SCHEMES } from '@/config/theme/colors';
import { UPDATE_SECTION_ICON_MAP } from '@/config/ui/site-content';
import { hexAlpha } from '@/lib/color';
import { cn } from '@subway-builder-modded/shared-ui';

export interface UpdateSectionProps {
  type: UpdateSectionType;
  children?: React.ReactNode;
  className?: string;
  themeId?: string;
}

export function UpdateSection({
  type,
  children,
  className,
  themeId,
}: UpdateSectionProps) {
  const config = UPDATE_SECTION_CONFIG[type];
  if (!config) return null;
  const SectionIcon = UPDATE_SECTION_ICON_MAP[type];
  const theme =
    themeId && themeId in PROJECT_COLOR_SCHEMES
      ? PROJECT_COLOR_SCHEMES[themeId as keyof typeof PROJECT_COLOR_SCHEMES]
      : PROJECT_COLOR_SCHEMES.website;

  return (
    <section
      className={cn(
        'relative mb-8 overflow-hidden rounded-xl border border-border/60 bg-card/70 p-4 last:mb-0 sm:p-5',
        className,
      )}
      style={
        {
          ['--section-accent-light' as string]: theme.accentColor.light,
          ['--section-accent-dark' as string]: theme.accentColor.dark,
          ['--section-soft-light' as string]: hexAlpha(
            theme.accentColor.light,
            0.15,
          ),
          ['--section-soft-dark' as string]: hexAlpha(
            theme.accentColor.dark,
            0.2,
          ),
        } as React.CSSProperties
      }
    >
      <span className="absolute inset-x-0 top-0 h-0.5 bg-[var(--section-accent-light)] dark:bg-[var(--section-accent-dark)]" />
      <span className="pointer-events-none absolute -right-14 -top-16 size-36 rounded-full bg-[var(--section-soft-light)] blur-3xl dark:bg-[var(--section-soft-dark)]" />

      <div className="relative mb-3 flex min-h-7 items-center gap-2.5">
        <span className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--section-accent-light)]/45 bg-[var(--section-accent-light)]/16 text-[var(--section-accent-light)] dark:border-[var(--section-accent-dark)]/45 dark:bg-[var(--section-accent-dark)]/20 dark:text-[var(--section-accent-dark)]">
          <SectionIcon className="size-4" />
        </span>
        <div
          role="heading"
          aria-level={2}
          className="m-0 inline-flex h-7 items-center leading-none text-sm font-bold uppercase tracking-widest text-muted-foreground"
        >
          {config.label}
        </div>
        <div className="h-px flex-1 self-center bg-border" />
      </div>

      <div
        className={cn(
          '[&_ul]:my-0 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5',
          '[&_li]:leading-7 [&_li]:text-foreground',
          '[&_p]:my-0 [&_p]:leading-7',
        )}
      >
        {children}
      </div>
    </section>
  );
}
