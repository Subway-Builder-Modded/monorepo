import Image from 'next/image';

import { HomeLinkButton } from '@/features/home/components/home-link-button';
import { ThemedShowcaseCard } from '@/components/ui/themed-showcase-card';
import type { HomeProjectCard } from '@/config/site/homepage';
import { cn } from '@subway-builder-modded/shared-ui';

type HomeProjectCardProps = {
  card: HomeProjectCard;
  className?: string;
};

export function HomeProjectCardView({ card, className }: HomeProjectCardProps) {
  return (
    <ThemedShowcaseCard
      variant="home"
      scheme={card.scheme}
      className={cn('flex h-full flex-col', className)}
    >
      <div className="relative z-10 grid h-full grid-rows-[auto_auto_1fr_auto] p-4 sm:p-5">
        <header className="flex min-h-14 items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-2xl font-black leading-tight tracking-tight">
              {card.title}
            </h3>
          </div>
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--ts-card-accent-light)]/45 bg-[var(--ts-card-soft-light)] text-[var(--ts-card-accent-light)] dark:border-[var(--ts-card-accent-dark)]/45 dark:bg-[var(--ts-card-soft-dark)] dark:text-[var(--ts-card-accent-dark)]">
            <card.icon className="size-4" aria-hidden="true" />
          </span>
        </header>

        <div className="relative mt-4 overflow-hidden rounded-xl border border-border/70 bg-background/50">
          <div className="relative aspect-[16/9]">
            <Image
              src={card.image.light}
              alt={card.image.alt}
              fill
              className="object-cover dark:hidden"
            />
            <Image
              src={card.image.dark}
              alt={card.image.alt}
              fill
              className="hidden object-cover dark:block"
            />
          </div>
        </div>

        <div className="mt-4 flex min-h-16 items-center justify-center">
          <p className="line-clamp-2 text-center text-sm leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </div>

        <div className="mt-4 flex min-h-10 flex-wrap items-center justify-center gap-2">
          {card.buttons.slice(0, 2).map((button) => (
            <HomeLinkButton key={`${card.id}-${button.label}`} link={button} />
          ))}
        </div>
      </div>
    </ThemedShowcaseCard>
  );
}
