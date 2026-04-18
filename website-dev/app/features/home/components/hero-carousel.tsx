import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { cn } from "@/app/lib/utils";
import { HERO_SLIDES, HERO_AUTO_ROTATE_MS } from "@/app/features/home/data/hero-slides";
import { HeroCreditsTooltip } from "@/app/features/home/components/hero-credits-tooltip";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function HeroCarousel() {
  const slides = HERO_SLIDES;
  const multi = slides.length > 1;
  const prefersReducedMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  /* parallax scroll transforms */
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 80]);
  const imgScale = useTransform(scrollY, [0, 600], [1, 1.06]);
  const overlayOpacity = useTransform(scrollY, [0, 400], [0.35, 0.7]);
  const contentY = useTransform(scrollY, [0, 500], [0, 40]);

  const go = useCallback(
    (n: number) => setIdx((n + slides.length) % slides.length),
    [slides.length],
  );
  const next = useCallback(() => go(idx + 1), [idx, go]);
  const prev = useCallback(() => go(idx - 1), [idx, go]);

  /* auto-rotation */
  useEffect(() => {
    if (!multi || paused || prefersReducedMotion) return;
    const timer = setInterval(next, HERO_AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [multi, paused, prefersReducedMotion, next]);

  /* keyboard */
  useEffect(() => {
    if (!multi) return;
    function onKey(e: KeyboardEvent) {
      if (
        !sectionRef.current?.contains(document.activeElement) &&
        document.activeElement !== sectionRef.current
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multi, next, prev]);

  const slide = slides[idx];

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] w-full overflow-hidden"
      onMouseEnter={() => multi && setPaused(true)}
      onMouseLeave={() => multi && setPaused(false)}
      onFocusCapture={() => multi && setPaused(true)}
      onBlurCapture={(e) => {
        if (multi && sectionRef.current && !sectionRef.current.contains(e.relatedTarget as Node))
          setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Hero showcase"
    >
      {/* ── Image layer ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0 will-change-transform"
          style={prefersReducedMotion ? undefined : { y: imgY, scale: imgScale }}
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{
            opacity: { duration: 1.4, ease: "easeInOut" },
            scale: { duration: 1.4, ease: "easeOut" },
          }}
          aria-roledescription="slide"
          aria-label={slide.alt}
        >
          <img
            src={slide.imageLight}
            alt={slide.alt}
            className="absolute inset-0 block h-full w-full object-cover dark:hidden"
            style={slide.focalPointLight ? { objectPosition: slide.focalPointLight } : undefined}
            loading="eager"
            draggable={false}
          />
          <img
            src={slide.imageDark}
            alt={slide.alt}
            className="absolute inset-0 hidden h-full w-full object-cover dark:block"
            style={slide.focalPointDark ? { objectPosition: slide.focalPointDark } : undefined}
            loading="eager"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Overlay gradients ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background via-background/25 to-transparent"
        style={prefersReducedMotion ? undefined : { opacity: overlayOpacity }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/40 via-transparent to-transparent"
        aria-hidden="true"
      />

      {/* ── Centered content stack ── */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center sm:px-7"
        style={prefersReducedMotion ? undefined : { y: contentY }}
      >
        <div className="max-w-[min(44rem,100%)]">
          {/* Subway-bar accent */}
          <div className="mb-5 flex items-center justify-center gap-2" aria-hidden="true">
            {["#0039A6", "#FF6319", "#00933C", "#FCCC0A", "#752F82"].map((c) => (
              <span
                key={c}
                className="h-1 w-7 rounded-full sm:w-9"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <h1
            className={cn(
              "font-black leading-[0.92] tracking-[-0.03em] text-foreground",
              "text-[clamp(2.5rem,8vw,5.5rem)]",
            )}
          >
            Subway Builder Modded
          </h1>

          <p className="mx-auto mt-4 max-w-md text-pretty text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed text-foreground/70">
            The complete hub for everything modded in Subway Builder.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://github.com/Subway-Builder-Modded"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors",
                "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              <GithubIcon className="size-4" />
              GitHub
            </a>
            <a
              href="https://discord.gg/syG9YHMyeG"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors",
                "border-foreground/15 bg-background/20 text-foreground backdrop-blur-sm hover:bg-background/40",
              )}
            >
              <FaDiscord className="size-4" aria-hidden="true" />
              Discord
            </a>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom bar: credits (left) + indicators (right) ── */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-5 pb-5 sm:px-7 sm:pb-7 lg:px-10">
        {/* Credits */}
        <HeroCreditsTooltip slide={slide} />

        {/* Indicators */}
        {multi && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero slides">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => go(i)}
                  className={cn(
                    "h-0.5 rounded-full transition-all duration-300",
                    i === idx ? "w-8 bg-foreground" : "w-4 bg-foreground/30 hover:bg-foreground/50",
                  )}
                />
              ))}
            </div>
            <div className="flex gap-1">
              {[
                { label: "Previous slide", icon: ChevronLeft, fn: prev },
                { label: "Next slide", icon: ChevronRight, fn: next },
              ].map(({ label, icon: Icon, fn }) => (
                <button
                  key={label}
                  type="button"
                  onClick={fn}
                  aria-label={label}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md border transition-colors sm:size-8",
                    "border-foreground/15 bg-background/20 text-foreground/70 backdrop-blur-sm",
                    "hover:bg-background/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
