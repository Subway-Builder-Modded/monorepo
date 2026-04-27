import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/cn';

export interface DirectoryCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  asChild?: boolean;
  interactive?: boolean;
  icon: React.ReactNode;
  heading: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  accentLight?: string;
  accentDark?: string;
  contentClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const DirectoryCard = React.forwardRef<HTMLDivElement, DirectoryCardProps>(
  (
    {
      asChild = false,
      interactive = true,
      icon,
      heading,
      description,
      trailing,
      showChevron = true,
      accentLight,
      accentDark,
      className,
      contentClassName,
      iconClassName,
      titleClassName,
      descriptionClassName,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const mergedStyle: React.CSSProperties = {
      ...(style as React.CSSProperties),
      ['--directory-card-accent-light' as string]: accentLight ?? 'var(--suite-accent-light)',
      ['--directory-card-accent-dark' as string]: accentDark ?? 'var(--suite-accent-dark)',
    };

    const rootClassName = cn(
      'group block rounded-xl border-2 border-border/60 bg-background/70 p-2 transition-all',
      interactive &&
        'hover:border-[color-mix(in_srgb,var(--directory-card-accent-light)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--directory-card-accent-light)_7%,transparent)]',
      interactive &&
        'dark:hover:border-[color-mix(in_srgb,var(--directory-card-accent-dark)_35%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--directory-card-accent-dark)_10%,transparent)]',
      className,
    );

    const content = (
      <div
        className={cn(
          'flex min-h-[clamp(3.2rem,7vw,4.2rem)] items-start gap-[clamp(0.55rem,1vw,0.8rem)] rounded-[clamp(0.6rem,1vw,0.8rem)] px-[clamp(0.55rem,1vw,0.8rem)] py-[clamp(0.35rem,0.8vw,0.6rem)]',
          contentClassName,
        )}
      >
        <div
          className={cn(
            'mt-[0.08rem] shrink-0 text-[var(--directory-card-accent-light)] opacity-85 transition-opacity group-hover:opacity-100 dark:text-[var(--directory-card-accent-dark)]',
            iconClassName,
          )}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className={cn('text-[clamp(0.85rem,1.1vw,0.96rem)] font-semibold leading-tight text-foreground', titleClassName)}>
            {heading}
          </div>
          {description ? (
            <div
              className={cn(
                'mt-[clamp(0.1rem,0.45vw,0.22rem)] whitespace-normal break-words text-[clamp(0.72rem,0.95vw,0.82rem)] leading-relaxed text-muted-foreground',
                descriptionClassName,
              )}
            >
              {description}
            </div>
          ) : null}
        </div>

        {trailing ? (
          <div className="shrink-0">{trailing}</div>
        ) : showChevron ? (
          <ChevronRight
            className="size-[clamp(0.75rem,1.05vw,0.9rem)] shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-65"
            aria-hidden="true"
          />
        ) : null}
      </div>
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        className?: string;
        style?: React.CSSProperties;
      }>;
      return React.cloneElement(child, {
        ...props,
        className: cn(rootClassName, child.props.className),
        style: {
          ...mergedStyle,
          ...(child.props.style ?? {}),
        },
      }, content);
    }

    return (
      <div
        ref={ref}
        className={rootClassName}
        style={mergedStyle}
        {...props}
      >
        {content}
      </div>
    );
  },
);

DirectoryCard.displayName = 'DirectoryCard';
