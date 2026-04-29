import { useMemo, useState } from "react";
import { RegistryListingCard, type RegistryContentItem } from "@/features/registry/components/shared/RegistryListingCard";

type RegistryLatestCarouselProps = {
  items: RegistryContentItem[];
};

const MARQUEE_DURATION_SECONDS = 34;

type ListingCardWrapperProps = {
  item: RegistryContentItem;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function ListingCardWrapper({ item, onMouseEnter, onMouseLeave }: ListingCardWrapperProps) {
  return <RegistryListingCard item={item} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />;
}

export function RegistryLatestCarousel({ items }: RegistryLatestCarouselProps) {
  const visibleItems = useMemo(() => (items.length > 0 ? items : []), [items]);
  const [isPaused, setIsPaused] = useState(false);
  const marqueeItems = useMemo(
    () => (visibleItems.length > 1 ? [...visibleItems, ...visibleItems] : visibleItems),
    [visibleItems],
  );

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
        <span className="text-xs font-medium text-muted-foreground">Latest community creations</span>
      </div>

      {visibleItems.length === 0 ? null : visibleItems.length === 1 ? (
        <ListingCardWrapper
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
              <ListingCardWrapper
                key={`${item.kind}-${item.id}-${index}`}
                item={item}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes registry-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 0.5rem));
          }
        }
      `}</style>
    </div>
  );
}