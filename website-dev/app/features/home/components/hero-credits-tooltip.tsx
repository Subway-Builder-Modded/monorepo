import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import type { HeroSlide } from "@/app/features/home/data/hero-slides";

type HeroCreditsTooltipProps = {
  slide: HeroSlide;
};

export function HeroCreditsTooltip({ slide }: HeroCreditsTooltipProps) {
  const hasMetadata = slide.mapName ?? slide.creator ?? slide.saveFileCreator;
  if (!hasMetadata) return null;

  return <CreditsButton slide={slide} />;
}

function CreditsButton({ slide }: { slide: HeroSlide }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const scheduleHide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative" onMouseEnter={show} onMouseLeave={scheduleHide}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={show}
        onBlur={scheduleHide}
        aria-label="View image credits and map information"
        aria-expanded={open}
        className={cn(
          "flex size-8 items-center justify-center rounded-md border transition-colors sm:size-9",
          "border-white/20 bg-black/30 text-white/70 backdrop-blur-sm",
          "hover:bg-black/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Info className="size-3.5 sm:size-4" aria-hidden="true" />
      </button>

      {open && <CreditsPlate slide={slide} />}
    </div>
  );
}

function CreditsPlate({ slide }: { slide: HeroSlide }) {
  return (
    <div
      role="tooltip"
      className={cn(
        "absolute bottom-full left-0 mb-2 w-64 origin-bottom-left sm:w-72",
        "rounded-lg border border-border/50 bg-popover/95 text-popover-foreground shadow-lg backdrop-blur-md",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
      )}
    >
      {/* top accent strip – signage-style */}
      <div className="h-0.5 w-full rounded-t-lg bg-foreground/20" aria-hidden="true" />

      <div className="space-y-2.5 p-3.5 text-[13px] leading-snug">
        {/* Map name + creator */}
        {slide.mapName && (
          <section>
            <h3 className="font-semibold text-foreground">
              {slide.mapId ? (
                <Link
                  to={`/railyard/browse/maps/${slide.mapId}`}
                  className="underline-offset-2 hover:underline"
                >
                  {slide.mapName}
                </Link>
              ) : (
                slide.mapName
              )}
            </h3>
            {slide.creator && (
              <p className="mt-0.5 text-muted-foreground">
                <span className="font-medium text-foreground/80">Creator:</span> {slide.creator}
              </p>
            )}
          </section>
        )}

        {/* Save file */}
        {slide.saveFileCreator && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Save File
            </h3>
            <p className="mt-0.5 text-muted-foreground">
              <span className="font-medium text-foreground/80">Creator:</span>{" "}
              {slide.saveFileCreator}
            </p>
          </section>
        )}

        {/* Mods */}
        {slide.mods && slide.mods.length > 0 && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Mods
            </h3>
            <ul className="mt-1 space-y-0.5">
              {slide.mods.map((mod) => (
                <li key={mod.modId} className="text-muted-foreground">
                  <Link
                    to={`/railyard/browse/mods/${mod.modId}`}
                    className="font-medium text-foreground/80 underline-offset-2 hover:underline"
                  >
                    {mod.name}
                  </Link>
                  <span> (by {mod.author})</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* arrow nub */}
      <div
        className="absolute -bottom-1 left-4 size-2 rotate-45 border-b border-r border-border/50 bg-popover/95"
        aria-hidden="true"
      />
    </div>
  );
}
