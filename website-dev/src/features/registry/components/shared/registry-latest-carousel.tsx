import { useMemo, useState } from "react";
import {
  RegistryListingCard,
  type RegistryContentItem,
} from "@/features/registry/components/shared/registry-listing-card";

type RegistryLatestCarouselProps = {
  items: RegistryContentItem[];
  isLoading?: boolean;
};

const MARQUEE_DURATION_SECONDS = 34;
const LOADING_SHELL_CARD_COUNT = 4;

function RegistryLatestCarouselShellCard({ index }: { index: number }) {
  return (
    <div
      key={`registry-shell-${index}`}
      className="w-[min(26rem,86vw)] shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card/92 shadow-lg lg:w-[min(30rem,52vw)] xl:w-[min(34rem,46vw)]"
      aria-hidden="true"
    >
      <div className="min-h-[27.5rem] animate-pulse">
        <div className="aspect-[16/8] w-full bg-muted/45" />
        <div className="space-y-3 px-4 py-4">
          <div className="h-4 w-20 rounded bg-muted/55" />
          <div className="h-6 w-3/4 rounded bg-muted/55" />
          <div className="h-4 w-1/2 rounded bg-muted/45" />
          <div className="space-y-2 pt-1">
            <div className="h-3.5 w-full rounded bg-muted/45" />
            <div className="h-3.5 w-11/12 rounded bg-muted/45" />
            <div className="h-3.5 w-10/12 rounded bg-muted/45" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegistryLatestCarousel({ items, isLoading = false }: RegistryLatestCarouselProps) {
  const visibleItems = useMemo(() => (items.length > 0 ? items : []), [items]);
  const [isPaused, setIsPaused] = useState(false);
  const marqueeItems = useMemo(
    () => (visibleItems.length > 1 ? [...visibleItems, ...visibleItems] : visibleItems),
    [visibleItems],
  );
  const shellItems = useMemo(
    () => Array.from({ length: LOADING_SHELL_CARD_COUNT }, (_, index) => index),
    [],
  );
  const shellMarqueeItems = useMemo(() => [...shellItems, ...shellItems], [shellItems]);

  function handleCardEnter() {
    setIsPaused(true);
  }

  function handleCardLeave() {
    setIsPaused(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Discover Content
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          Latest community creations
        </span>
      </div>

      {isLoading ? (
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div
            className="flex w-max gap-4 py-1 pr-4"
            style={{
              animation: `registry-marquee ${MARQUEE_DURATION_SECONDS}s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={handleCardLeave}
          >
            {shellMarqueeItems.map((index, shellIndex) => (
              <RegistryLatestCarouselShellCard key={`shell-${index}-${shellIndex}`} index={index} />
            ))}
          </div>
        </div>
      ) : visibleItems.length === 0 ? null : visibleItems.length === 1 ? (
        <RegistryListingCard
          item={visibleItems[0]!}
          onMouseEnter={() => undefined}
          onMouseLeave={() => undefined}
        />
      ) : (
        <div
          className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={handleCardLeave}
        >
          <div
            className="flex w-max gap-4 py-1 pr-4"
            style={{
              animation: `registry-marquee ${MARQUEE_DURATION_SECONDS}s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {marqueeItems.map((item, index) => (
              <RegistryListingCard
                key={`${item.kind}-${item.id}-${index}`}
                item={item}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
