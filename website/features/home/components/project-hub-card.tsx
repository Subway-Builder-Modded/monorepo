import { ArrowRight, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { ThemedColorSet } from '@/config/theme/colors';
import { ThemedShowcaseCard } from '@/components/ui/themed-showcase-card';
import { cn } from '@subway-builder-modded/shared-ui';

type ProjectHubCardProps = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  colors: ThemedColorSet;
  eyebrow?: string;
  className?: string;
};

function toCardPalette(colors: ThemedColorSet) {
  return {
    accent: colors.accentColor,
    primary: colors.primaryColor,
    secondary: colors.secondaryColor,
    text: colors.textColor,
    textInverted: colors.textColorInverted,
  };
}

export function ProjectHubCard({
  href,
  label,
  description,
  icon: Icon,
  image,
  colors,
  eyebrow,
  className,
}: ProjectHubCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <ThemedShowcaseCard
        variant="hub"
        palette={toCardPalette(colors)}
        className={cn('flex h-full min-h-[21rem] flex-col', className)}
      >
        <span className="pointer-events-none absolute -inset-x-8 -bottom-10 h-28 bg-gradient-to-t from-[var(--ts-card-soft-light)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-[var(--ts-card-soft-dark)]" />

        <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {eyebrow}
                </p>
              ) : null}
              <h2 className="truncate text-2xl font-black tracking-tight text-[var(--ts-card-text-light)] dark:text-[var(--ts-card-text-dark)]">
                {label}
              </h2>
            </div>

            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--ts-card-secondary-light)] bg-[var(--ts-card-primary-light)] text-[var(--ts-card-text-light)] transition-transform duration-300 group-hover:scale-105 dark:border-[var(--ts-card-secondary-dark)] dark:bg-[var(--ts-card-primary-dark)] dark:text-[var(--ts-card-text-dark)]">
              <Icon className="size-4" aria-hidden="true" />
            </span>
          </header>

          <div className="relative mb-4 overflow-hidden rounded-xl border border-[var(--ts-card-secondary-light)]/80 bg-background/50 dark:border-[var(--ts-card-secondary-dark)]/80">
            <div className="relative aspect-[16/9]">
              <Image
                src={image.light}
                alt={image.alt}
                fill
                className="object-cover dark:hidden"
              />
              <Image
                src={image.dark}
                alt={image.alt}
                fill
                className="hidden object-cover dark:block"
              />
            </div>
          </div>

          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-auto pt-4">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ts-card-accent-light)] transition-transform duration-300 group-hover:translate-x-1 dark:text-[var(--ts-card-accent-dark)]">
              Explore
              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </ThemedShowcaseCard>
    </Link>
  );
}
