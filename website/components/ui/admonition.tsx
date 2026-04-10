'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  InfoIcon,
  LightbulbIcon,
  StarIcon,
  TriangleAlertIcon,
  FlameIcon,
  ShieldAlertIcon,
  CircleCheckBigIcon,
  BugIcon,
  FlaskConicalIcon,
  MegaphoneIcon,
  ArchiveX,
} from 'lucide-react';

import { cn } from '@subway-builder-modded/shared-ui';

const admonitionVariants = cva(
  'my-6 flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border-l-[3px] px-4 py-3 text-sm [&>svg]:mt-[1px] [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        note: 'border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-foreground [&>svg]:text-blue-500',
        tip: 'border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 text-foreground [&>svg]:text-emerald-500',
        important:
          'border-l-purple-500 bg-purple-500/5 dark:bg-purple-500/10 text-foreground [&>svg]:text-purple-500',
        warning:
          'border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10 text-foreground [&>svg]:text-amber-500',
        caution:
          'border-l-orange-500 bg-orange-500/5 dark:bg-orange-500/10 text-foreground [&>svg]:text-orange-500',
        danger:
          'border-l-red-500 bg-red-500/5 dark:bg-red-500/10 text-foreground [&>svg]:text-red-500',
        info: 'border-l-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 text-foreground [&>svg]:text-cyan-500',
        success:
          'border-l-green-500 bg-green-500/5 dark:bg-green-500/10 text-foreground [&>svg]:text-green-500',
        deprecated:
          'border-l-zinc-500 bg-zinc-500/5 dark:bg-zinc-500/10 text-foreground [&>svg]:text-zinc-500',
        bug: 'border-l-pink-500 bg-pink-500/5 dark:bg-pink-500/10 text-foreground [&>svg]:text-pink-500',
        example:
          'border-l-sky-500 bg-sky-500/5 dark:bg-sky-500/10 text-foreground [&>svg]:text-sky-500',
        announcement:
          'border-l-fuchsia-500 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 text-foreground [&>svg]:text-fuchsia-500',
      },
    },
    defaultVariants: {
      variant: 'note',
    },
  },
);

const admonitionTitleVariants = cva(
  'font-semibold uppercase tracking-[0.03em]',
  {
    variants: {
      variant: {
        note: 'text-foreground',
        tip: 'text-foreground',
        important: 'text-foreground',
        warning: 'text-foreground',
        caution: 'text-foreground',
        danger: 'text-foreground',
        info: 'text-foreground',
        success: 'text-foreground',
        deprecated: 'text-foreground',
        bug: 'text-foreground',
        example: 'text-foreground',
        announcement: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'note',
    },
  },
);

type AdmonitionVariant = NonNullable<
  VariantProps<typeof admonitionVariants>['variant']
>;

const icons: Record<
  AdmonitionVariant,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  note: InfoIcon,
  tip: LightbulbIcon,
  important: StarIcon,
  warning: TriangleAlertIcon,
  caution: FlameIcon,
  danger: ShieldAlertIcon,
  info: InfoIcon,
  success: CircleCheckBigIcon,
  deprecated: ArchiveX,
  bug: BugIcon,
  example: FlaskConicalIcon,
  announcement: MegaphoneIcon,
};

const labels: Record<AdmonitionVariant, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
  danger: 'Danger',
  info: 'Info',
  success: 'Success',
  deprecated: 'Deprecated',
  bug: 'Bug',
  example: 'Example',
  announcement: 'Announcement',
};

interface AdmonitionProps
  extends React.ComponentProps<'div'>, VariantProps<typeof admonitionVariants> {
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return flattenText(node.props.children);
  }

  return '';
}

function deriveTitleFromChildren(children: React.ReactNode) {
  const nodes = React.Children.toArray(children);

  if (nodes.length < 2) {
    return {
      derivedTitle: null as string | null,
      bodyChildren: children,
    };
  }

  const first = nodes[0];

  if (!React.isValidElement<{ children?: React.ReactNode }>(first)) {
    return {
      derivedTitle: null as string | null,
      bodyChildren: children,
    };
  }

  const text = flattenText(first.props.children).trim();

  if (!text) {
    return {
      derivedTitle: null as string | null,
      bodyChildren: children,
    };
  }

  const looksLikeTitle = text.length <= 80 && !/[.!?]$/.test(text);

  if (!looksLikeTitle) {
    return {
      derivedTitle: null as string | null,
      bodyChildren: children,
    };
  }

  return {
    derivedTitle: text,
    bodyChildren: nodes.slice(1),
  };
}

function Admonition({
  className,
  variant = 'note',
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  ...props
}: AdmonitionProps) {
  const resolvedVariant = variant ?? 'note';
  const Icon = icons[resolvedVariant];
  const defaultTitle = labels[resolvedVariant];
  const [open, setOpen] = React.useState(defaultOpen);

  const { derivedTitle, bodyChildren } = React.useMemo(
    () => deriveTitleFromChildren(children),
    [children],
  );

  const finalTitle = title ?? derivedTitle ?? defaultTitle;

  return (
    <div
      data-slot="admonition"
      data-variant={resolvedVariant}
      data-open={open ? 'true' : 'false'}
      className={cn(
        admonitionVariants({ variant: resolvedVariant }),
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex w-full items-center gap-2 text-left"
            aria-expanded={open}
          >
            <p
              className={cn(
                'leading-none',
                admonitionTitleVariants({ variant: resolvedVariant }),
              )}
            >
              {finalTitle}
            </p>
            <span className="ml-auto text-current/70">{open ? '−' : '+'}</span>
          </button>
        ) : (
          <p
            className={cn(
              'leading-none',
              admonitionTitleVariants({ variant: resolvedVariant }),
            )}
          >
            {finalTitle}
          </p>
        )}

        {!collapsible || open ? (
          <div
            className={cn(
              'mt-1.5 min-w-0 break-words text-current/80 [overflow-wrap:anywhere]',
              '[&>p:first-child]:mt-0',
              '[&_p]:leading-relaxed',
              '[&_ul]:my-3 [&_ul]:ml-5 [&_ul]:list-disc',
              '[&_ol]:my-3 [&_ol]:ml-5 [&_ol]:list-decimal',
              '[&_li]:mt-1.5',
              '[&_pre]:box-border [&_pre]:max-w-full [&_pre]:overflow-x-auto',
              '[&_[data-rehype-pretty-code-figure]]:max-w-full [&_[data-rehype-pretty-code-figure]]:overflow-x-auto',
              '[&_code]:break-words',
            )}
          >
            {title || derivedTitle ? bodyChildren : children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Note(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="note" {...props} />;
}

function Tip(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="tip" {...props} />;
}

function Important(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="important" {...props} />;
}

function Warning(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="warning" {...props} />;
}

function Caution(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="caution" {...props} />;
}

function Danger(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="danger" {...props} />;
}

function Info(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="info" {...props} />;
}

function Success(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="success" {...props} />;
}

function Deprecated(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="deprecated" {...props} />;
}

function Bug(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="bug" {...props} />;
}

function Example(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="example" {...props} />;
}

function Announcement(props: Omit<AdmonitionProps, 'variant'>) {
  return <Admonition variant="announcement" {...props} />;
}

export {
  Admonition,
  Note,
  Tip,
  Important,
  Warning,
  Caution,
  Danger,
  Info,
  Success,
  Deprecated,
  Bug,
  Example,
  Announcement,
};
