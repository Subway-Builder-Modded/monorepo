import type { LucideIcon } from 'lucide-react';
import type { ModeHex } from '@/config/theme/colors';
import { hexAlpha } from '@/lib/color';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { cn } from '@/lib/utils';

export type PageHeaderColorScheme = {
  accent: ModeHex;
  spotlight?: ModeHex;
};

export type PageHeaderBadgeColorScheme = {
  border: ModeHex;
  background: ModeHex;
  text: ModeHex;
};

export type PageHeaderBadgeConfig = {
  text: string;
  icon?: LucideIcon;
  colorScheme?: PageHeaderBadgeColorScheme;
  uppercase?: boolean;
};

export type PageHeaderConfig = {
  icon: LucideIcon;
  title: string;
  description?: string;
  colorScheme?: PageHeaderColorScheme;
  badges?: PageHeaderBadgeConfig[];
  size?: 'default' | 'compact' | 'sidebar';
  className?: string;
};

function InlineMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children }) => <>{children}</>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="rounded-sm bg-foreground/10 px-1 py-0.5 font-mono text-[0.92em]">
              {children}
            </code>
          ),
          u: ({ children }) => <u>{children}</u>,
        }}
      >
        {content}
      </Markdown>
    </span>
  );
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  colorScheme,
  badges,
  size = 'default',
  className,
}: PageHeaderConfig) {
  const hasCustomScheme = !!colorScheme;
  const isCompact = size === 'compact' || size === 'sidebar';
  const isSidebar = size === 'sidebar';
  const accentLight = colorScheme?.accent.light ?? '#6b7280';
  const accentDark = colorScheme?.accent.dark ?? '#9ca3af';
  const spotlightLight =
    colorScheme?.spotlight?.light ?? hexAlpha(accentLight, 0.22);
  const spotlightDark =
    colorScheme?.spotlight?.dark ?? hexAlpha(accentDark, 0.24);

  return (
    <header
      className={cn('relative mb-10 text-center', className)}
      style={
        hasCustomScheme
          ? {
              ['--page-header-accent-light' as string]: accentLight,
              ['--page-header-accent-dark' as string]: accentDark,
              ['--page-header-spotlight-light' as string]: spotlightLight,
              ['--page-header-spotlight-dark' as string]: spotlightDark,
            }
          : undefined
      }
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 mx-auto rounded-full blur-3xl',
          isSidebar
            ? '-top-7 h-24 max-w-sm'
            : isCompact
              ? '-top-7 h-24 max-w-sm'
              : '-top-10 h-36 w-full',
          hasCustomScheme
            ? 'bg-gradient-to-r from-transparent via-[var(--page-header-spotlight-light)] to-transparent dark:via-[var(--page-header-spotlight-dark)]'
            : 'bg-gradient-to-r from-transparent via-primary/20 to-transparent',
        )}
      />

      {badges?.length ? (
        <div
          className={cn(
            'relative z-10 flex flex-wrap items-center justify-center gap-2',
            isSidebar ? 'mb-3' : isCompact ? 'mb-2' : 'mb-3',
          )}
        >
          {badges.map((badge) => {
            const BadgeIcon = badge.icon;
            const borderLight =
              badge.colorScheme?.border.light ?? hexAlpha(accentLight, 0.44);
            const borderDark =
              badge.colorScheme?.border.dark ?? hexAlpha(accentDark, 0.5);
            const bgLight =
              badge.colorScheme?.background.light ??
              hexAlpha(accentLight, 0.12);
            const bgDark =
              badge.colorScheme?.background.dark ?? hexAlpha(accentDark, 0.2);
            const textLight = badge.colorScheme?.text.light ?? accentLight;
            const textDark = badge.colorScheme?.text.dark ?? accentDark;

            return (
              <span
                key={badge.text}
                className={cn(
                  'inline-flex items-center rounded-full border border-[var(--badge-border-light)] bg-[var(--badge-bg-light)] font-semibold tracking-wide text-[var(--badge-text-light)] dark:border-[var(--badge-border-dark)] dark:bg-[var(--badge-bg-dark)] dark:text-[var(--badge-text-dark)]',
                  isSidebar
                    ? 'gap-1.5 px-2.5 py-1 text-xs'
                    : isCompact
                      ? 'gap-1.5 px-2.5 py-1 text-[11px]'
                      : 'gap-2 px-3 py-1 text-xs',
                  badge.uppercase === true ? 'uppercase' : 'normal-case',
                )}
                style={{
                  ['--badge-border-light' as string]: borderLight,
                  ['--badge-bg-light' as string]: bgLight,
                  ['--badge-text-light' as string]: textLight,
                  ['--badge-border-dark' as string]: borderDark,
                  ['--badge-bg-dark' as string]: bgDark,
                  ['--badge-text-dark' as string]: textDark,
                }}
              >
                {BadgeIcon ? (
                  <BadgeIcon className="size-3.5" aria-hidden="true" />
                ) : null}
                <InlineMarkdown content={badge.text} className="leading-none" />
              </span>
            );
          })}
        </div>
      ) : null}

      <h1
        className={cn(
          'relative mt-1 inline-flex items-center justify-center font-black tracking-tight',
          isSidebar
            ? 'gap-2.5 text-[2.35rem] leading-tight'
            : isCompact
              ? 'gap-2 text-2xl'
              : 'gap-3 text-4xl sm:text-5xl',
        )}
      >
        <Icon
          className={cn(
            'text-foreground',
            isSidebar
              ? 'size-[1em]'
              : isCompact
                ? 'size-[0.85em]'
                : 'size-[0.95em]',
          )}
          aria-hidden="true"
        />
        <InlineMarkdown content={title} />
      </h1>

      {description ? (
        <p
          className={cn(
            'text-muted-foreground',
            isCompact
              ? 'mt-2 max-w-xs text-xs leading-4'
              : 'mt-3 w-full text-base sm:text-lg',
          )}
        >
          <InlineMarkdown content={description} />
        </p>
      ) : null}
    </header>
  );
}
