import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/router";
import { HERO_CREDITS_TEXT, type HeroSlide } from "@/config/home";

type HeroCreditsTooltipProps = {
  slide: HeroSlide;
};

export function HeroCreditsTooltip({ slide }: HeroCreditsTooltipProps) {
  const hasMetadata = slide.mapName ?? slide.creator ?? slide.saveFileCreator;
  if (!hasMetadata) return null;

  return <CreditsButton slide={slide} />;
}

function CreditsButton({ slide }: { slide: HeroSlide }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const hoverLeaveTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const open = pinned || hovered || focusWithin;

  const clearHoverLeaveTimer = useCallback(() => {
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  }, []);

  const onHoverRegionEnter = useCallback(() => {
    clearHoverLeaveTimer();
    setHovered(true);
  }, [clearHoverLeaveTimer]);

  const onHoverRegionLeave = useCallback(() => {
    clearHoverLeaveTimer();
    hoverLeaveTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      hoverLeaveTimerRef.current = null;
    }, 140);
  }, [clearHoverLeaveTimer]);

  useEffect(() => {
    return () => {
      clearHoverLeaveTimer();
    };
  }, [clearHoverLeaveTimer]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPinned(false);
        setHovered(false);
        setFocusWithin(false);
      }
    }

    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
        setFocusWithin(false);
      }
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={onHoverRegionEnter}
      onMouseLeave={onHoverRegionLeave}
      onFocusCapture={() => {
        clearHoverLeaveTimer();
        setFocusWithin(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setPinned((v) => !v)}
       
        aria-expanded={open}
        className={cn(
          "flex size-8 items-center justify-center rounded-md border transition-colors sm:size-9",
          open
            ? "border-border/70 bg-popover/90 text-popover-foreground"
            : "border-border/55 bg-popover/65 text-popover-foreground/75",
          "backdrop-blur-sm",
          "hover:bg-popover hover:text-popover-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Info className="size-3.5 sm:size-4" aria-hidden="true" />
      </button>

      {open && (
        <CreditsPlate
          slide={slide}
          onMouseEnter={onHoverRegionEnter}
          onMouseLeave={onHoverRegionLeave}
        />
      )}
    </div>
  );
}

function CreditsPlate({
  slide,
  onMouseEnter,
  onMouseLeave,
}: {
  slide: HeroSlide;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      role="tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "absolute bottom-full left-0 mb-2 w-64 origin-bottom-left sm:w-72",
        "rounded-lg border border-border/50 bg-popover/95 text-popover-foreground shadow-lg backdrop-blur-md",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
      )}
    >
      <div className="h-0.5 w-full rounded-t-lg bg-foreground/20" aria-hidden="true" />

      <div className="space-y-2.5 p-3.5 text-[13px] leading-snug">
        {(slide.mapName || slide.saveFileCreator) && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {HERO_CREDITS_TEXT.mapDetailsTitle}
            </h3>

            <ul className="mt-1 space-y-0.5">
              {slide.mapName && (
                <li className="text-muted-foreground">
                  {slide.mapId ? (
                    <Link
                      to={`/railyard/browse/maps/${slide.mapId}`}
                      className="font-bold text-foreground underline-offset-2 hover:underline"
                    >
                      {slide.mapName}
                    </Link>
                  ) : (
                    <span className="font-bold text-foreground">{slide.mapName}</span>
                  )}
                  {slide.creator ? (
                    <span className="text-muted-foreground">
                      {" "}
                      (by <span className="font-bold text-foreground">{slide.creator}</span>)
                    </span>
                  ) : null}
                </li>
              )}

              {slide.saveFileCreator && (
                <li className="text-muted-foreground">
                  Save file by:{" "}
                  <span className="font-bold text-foreground">{slide.saveFileCreator}</span>
                </li>
              )}
            </ul>
          </section>
        )}

        {slide.mods && slide.mods.length > 0 && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {HERO_CREDITS_TEXT.modsTitle}
            </h3>
            <ul className="mt-1 space-y-0.5">
              {slide.mods.map((mod) => (
                <li key={mod.modId} className="text-muted-foreground">
                  <Link
                    to={`/railyard/browse/mods/${mod.modId}`}
                    className="font-bold text-foreground underline-offset-2 hover:underline"
                  >
                    {mod.name}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    (by <span className="font-bold text-foreground">{mod.author}</span>)
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div
        className="absolute -bottom-1 left-4 size-2 rotate-45 border-b border-r border-border/50 bg-popover/95"
        aria-hidden="true"
      />
    </div>
  );
}
