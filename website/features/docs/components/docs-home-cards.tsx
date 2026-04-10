'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bug,
  CirclePlus,
  User,
  CodeXml,
  FolderClock,
  MapPlus,
  PackagePlus,
  Sparkles,
  Plus,
  Folder,
  Link2,
  Atom,
  SearchCode,
  ArrowDownToLine,
  KeyRound,
  ShieldCheck,
  Globe,
  Tag,
  Inbox,
  CircleUser,
  type LucideIcon,
} from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@subway-builder-modded/shared-ui';

const ICONS = {
  User,
  CodeXml,
  CirclePlus,
  PackagePlus,
  MapPlus,
  Sparkles,
  FolderClock,
  Bug,
  Plus,
  Folder,
  Link2,
  Atom,
  SearchCode,
  ArrowDownToLine,
  KeyRound,
  ShieldCheck,
  Globe,
  Tag,
  Inbox,
  CircleUser,
} satisfies Record<string, LucideIcon>;

type DocsCardIconName = keyof typeof ICONS;

const DOCS_CARD_SELECTOR = '[data-docs-card]';
const DOCS_CARD_HEADING_SELECTOR = '[data-docs-card-heading]';

function syncDocsCardRowHeadingHeights(container: HTMLElement) {
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>(DOCS_CARD_SELECTOR),
  );

  if (!cards.length) {
    return;
  }

  cards.forEach((card) =>
    card.style.removeProperty('--docs-card-heading-height'),
  );

  const containerRect = container.getBoundingClientRect();
  const rows = new Map<
    number,
    Array<{ card: HTMLElement; heading: HTMLElement }>
  >();

  cards.forEach((card) => {
    const heading = card.querySelector<HTMLElement>(DOCS_CARD_HEADING_SELECTOR);
    if (!heading) {
      return;
    }

    const rowKey = Math.round(
      card.getBoundingClientRect().top - containerRect.top,
    );
    const rowCards = rows.get(rowKey);

    if (rowCards) {
      rowCards.push({ card, heading });
      return;
    }

    rows.set(rowKey, [{ card, heading }]);
  });

  rows.forEach((rowCards) => {
    const maxHeadingHeight = Math.max(
      ...rowCards.map(({ heading }) => heading.offsetHeight),
    );
    const headingHeightValue = `${maxHeadingHeight}px`;

    rowCards.forEach(({ card }) => {
      card.style.setProperty('--docs-card-heading-height', headingHeightValue);
    });
  });
}

export function DocsCardGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }

    const measure = () => {
      syncDocsCardRowHeadingHeights(grid);
    };

    const raf = requestAnimationFrame(measure);

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(grid);

    grid.querySelectorAll<HTMLElement>(DOCS_CARD_SELECTOR).forEach((card) => {
      resizeObserver.observe(card);
    });

    grid
      .querySelectorAll<HTMLElement>(DOCS_CARD_HEADING_SELECTOR)
      .forEach((heading) => {
        resizeObserver.observe(heading);
      });

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(grid, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [children]);

  return (
    <div
      ref={gridRef}
      className={cn('my-8 grid grid-cols-1 gap-4 md:grid-cols-2', className)}
    >
      {children}
    </div>
  );
}

export function DocsCard({
  title,
  href,
  icon,
  className,
  children,
}: {
  title: string;
  href: string;
  icon?: DocsCardIconName;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = icon ? ICONS[icon] : undefined;

  return (
    <Link href={href} className="block h-full outline-none">
      <Card
        data-docs-card
        className={cn(
          'h-full border border-border/60 bg-card/60',
          'transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out',
          'hover:-translate-y-0.5 hover:border-border hover:bg-card',
          'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_24px_rgba(255,255,255,0.04)]',
          'focus-visible:ring-2 focus-visible:ring-ring/40',
          className,
        )}
      >
        <CardHeader className="gap-2 px-5 py-2">
          <div
            data-docs-card-heading
            className="flex min-h-[var(--docs-card-heading-height,auto)] items-center"
          >
            <CardTitle className="w-full text-base font-semibold leading-tight text-foreground">
              <span className="flex items-center gap-2">
                {Icon ? (
                  <Icon
                    className="size-4 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                ) : null}
                <span>{title}</span>
              </span>
            </CardTitle>
          </div>

          <CardDescription
            className={cn(
              'text-sm text-muted-foreground',
              '[&_p]:m-0',
              '[&_p]:text-sm',
              '[&_p]:leading-5',
              '[&_p]:text-muted-foreground',
            )}
          >
            {children}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
