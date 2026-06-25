import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  RegistryListingCard,
  type RegistryContentItem,
} from "@/features/registry/components/shared/registry-listing-card";

type RegistryLatestCarouselProps = {
  items: RegistryContentItem[];
  isLoading?: boolean;
};

const MARQUEE_DURATION_SECONDS = 34;
const MARQUEE_STOP_DURATION_MS = 160;
const MARQUEE_RESUME_DURATION_MS = 120;
const LOADING_SHELL_CARD_COUNT = 4;

function approach(current: number, target: number, deltaMs: number, durationMs: number) {
  if (durationMs <= 0) return target;

  const progress = Math.min(deltaMs / durationMs, 1);
  const next = current + (target - current) * progress;
  return Math.abs(next - target) < 0.001 ? target : next;
}

function RegistryLatestCarouselShellCard({ index }: { index: number }) {
  return (
    <div
      key={`registry-shell-${index}`}
      className="w-[min(22rem,80vw)] shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card/92 shadow-sm lg:w-[min(24rem,44vw)]"
      aria-hidden="true"
    >
      <div className="animate-pulse">
        <div className="aspect-[2/1] w-full bg-muted/45" />
        <div className="space-y-2 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-14 rounded bg-muted/55" />
            <div className="h-3 w-16 rounded bg-muted/45" />
          </div>
          <div className="h-4 w-3/4 rounded bg-muted/55" />
          <div className="h-3 w-2/5 rounded bg-muted/45" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-muted/45" />
            <div className="h-3 w-10/12 rounded bg-muted/45" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegistryLatestCarousel({ items, isLoading = false }: RegistryLatestCarouselProps) {
  const visibleItems = useMemo(() => (items.length > 0 ? items : []), [items]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const speedRef = useRef(1);
  const targetSpeedRef = useRef(1);
  const marqueeItems = useMemo(
    () => (visibleItems.length > 1 ? [...visibleItems, ...visibleItems] : visibleItems),
    [visibleItems],
  );
  const shellItems = useMemo(
    () => Array.from({ length: LOADING_SHELL_CARD_COUNT }, (_, index) => index),
    [],
  );
  const shellMarqueeItems = useMemo(() => [...shellItems, ...shellItems], [shellItems]);

  const updateLoopWidth = useCallback(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    loopWidthRef.current = marquee.scrollWidth / 2;
  }, []);

  const stopAnimationFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastFrameAtRef.current = null;
  }, []);

  const runMarqueeFrame = useCallback(
    (now: number) => {
      const marquee = marqueeRef.current;
      if (!marquee) {
        stopAnimationFrame();
        return;
      }

      updateLoopWidth();

      const loopWidth = loopWidthRef.current;
      const previousFrameAt = lastFrameAtRef.current ?? now;
      const deltaMs = Math.min(now - previousFrameAt, 50);
      const targetSpeed = targetSpeedRef.current;
      const easingDuration = targetSpeed === 0 ? MARQUEE_STOP_DURATION_MS : MARQUEE_RESUME_DURATION_MS;

      speedRef.current = approach(speedRef.current, targetSpeed, deltaMs, easingDuration);

      if (loopWidth > 0 && speedRef.current > 0) {
        const pixelsPerMs = loopWidth / (MARQUEE_DURATION_SECONDS * 1000);
        offsetRef.current = (offsetRef.current + pixelsPerMs * speedRef.current * deltaMs) % loopWidth;
        marquee.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      lastFrameAtRef.current = now;

      if (targetSpeed > 0 || speedRef.current > 0) {
        animationFrameRef.current = window.requestAnimationFrame(runMarqueeFrame);
        return;
      }

      stopAnimationFrame();
    },
    [stopAnimationFrame, updateLoopWidth],
  );

  const startAnimationFrame = useCallback(() => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = window.requestAnimationFrame(runMarqueeFrame);
    }
  }, [runMarqueeFrame]);

  const setMarqueePaused = useCallback(
    (paused: boolean) => {
      targetSpeedRef.current = paused ? 0 : 1;
      startAnimationFrame();
    },
    [startAnimationFrame],
  );

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      marquee.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    offsetRef.current = 0;
    speedRef.current = 1;
    targetSpeedRef.current = 1;
    marquee.style.transform = "translate3d(0, 0, 0)";

    updateLoopWidth();
    startAnimationFrame();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateLoopWidth) : null;
    resizeObserver?.observe(marquee);

    return () => {
      resizeObserver?.disconnect();
      stopAnimationFrame();
    };
  }, [
    isLoading,
    marqueeItems.length,
    shellMarqueeItems.length,
    startAnimationFrame,
    stopAnimationFrame,
    updateLoopWidth,
  ]);

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
            ref={marqueeRef}
            className="flex w-max transform-gpu gap-4 py-1 pr-4 [will-change:transform]"
            onMouseEnter={() => setMarqueePaused(true)}
            onMouseLeave={() => setMarqueePaused(false)}
            onFocus={() => setMarqueePaused(true)}
            onBlur={() => setMarqueePaused(false)}
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
          onMouseEnter={() => setMarqueePaused(true)}
          onMouseLeave={() => setMarqueePaused(false)}
          onFocus={() => setMarqueePaused(true)}
          onBlur={() => setMarqueePaused(false)}
        >
          <div
            ref={marqueeRef}
            className="flex w-max transform-gpu gap-4 py-1 pr-4 [will-change:transform]"
          >
            {marqueeItems.map((item, index) => (
              <RegistryListingCard
                key={`${item.kind}-${item.id}-${index}`}
                item={item}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
