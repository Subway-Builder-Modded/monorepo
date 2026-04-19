import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { cn } from "@/app/lib/utils";
import { HERO_SLIDES, HERO_AUTO_ROTATE_MS } from "@/app/features/home/data/hero-slides";
import { HERO_SUITE_BARS } from "@/app/features/home/data/homepage-content";
import { HeroCreditsTooltip } from "@/app/features/home/components/hero-credits-tooltip";
import { GithubIcon } from "@/app/features/home/components/icons";

function usePreloadImages(slides: typeof HERO_SLIDES) {
  useEffect(() => {
    for (const slide of slides) {
      for (const src of [slide.imageLight, slide.imageDark]) {
        const img = new Image();
        img.src = src;
      }
    }
  }, [slides]);
}

export function HeroCarousel() {
  const slides = HERO_SLIDES;
  const multi = slides.length > 1;
  const prefersReducedMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  usePreloadImages(slides);

  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 80]);
  const imgScale = useTransform(scrollY, [0, 600], [1, 1.06]);
  const contentY = useTransform(scrollY, [0, 500], [0, 40]);

  const go = useCallback(
    (n: number) => setIdx((n + slides.length) % slides.length),
    [slides.length],
  );
  const next = useCallback(() => go(idx + 1), [idx, go]);
  const prev = useCallback(() => go(idx - 1), [idx, go]);

  useEffect(() => {
    if (!multi || paused || prefersReducedMotion) return;
    const timer = setInterval(next, HERO_AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [multi, paused, prefersReducedMotion, next]);

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
      {/* Persistent scroll-responsive wrapper — never remounts on slide change */}
      <motion.div
        className="absolute inset-0"
        style={prefersReducedMotion ? undefined : { y: imgY, scale: imgScale }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.2, ease: "easeInOut" } }}
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
      </motion.div>

      {/* Top readability treatment — darkens/brightens strongest at top, fades down */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/80 via-background/30 via-40% to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-48 backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]"
        aria-hidden="true"
      />

      {/* Bottom gradient for content readability */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background via-background/20 via-30% to-transparent"
        aria-hidden="true"
      />

      {/* Centered content */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center sm:px-7"
        style={prefersReducedMotion ? undefined : { y: contentY }}
      >
        <div>
          <div className="mb-5 flex items-center justify-center gap-2" aria-hidden="true">
            {HERO_SUITE_BARS.map((c, i) => (
              <span
                key={i}
                className="hidden h-1.5 w-8 rounded-full dark:block sm:w-10"
                style={{ backgroundColor: c.dark }}
              />
            ))}
            {HERO_SUITE_BARS.map((c, i) => (
              <span
                key={`l${i}`}
                className="block h-1.5 w-8 rounded-full dark:hidden sm:w-10"
                style={{ backgroundColor: c.light }}
              />
            ))}
          </div>

          <h1 className="text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-foreground">
            Subway Builder Modded
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[clamp(1.05rem,2.2vw,1.25rem)] leading-relaxed text-foreground/75">
            The complete hub for everything modded in Subway Builder.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://github.com/Subway-Builder-Modded"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-lg border border-transparent bg-foreground px-6 py-3 text-[15px] font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90"
            >
              <GithubIcon className="size-[18px]" />
              GitHub
            </a>
            <a
              href="https://discord.gg/syG9YHMyeG"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-lg border border-foreground/15 bg-background/20 px-6 py-3 text-[15px] font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background/40"
            >
              <FaDiscord className="size-[18px]" aria-hidden="true" />
              Discord
            </a>
          </div>
        </div>
      </motion.div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-5 pb-5 sm:px-7 sm:pb-7 lg:px-10">
        <HeroCreditsTooltip slide={slide} />
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
                  aria-label={label}
                  onClick={fn}
                  className="rounded-full bg-foreground/10 p-1.5 backdrop-blur-sm transition-colors hover:bg-foreground/20"
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suite-colored hero bars */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex h-1">
        {HERO_SUITE_BARS.map((bar, i) => (
          <div key={i} className="flex-1">
            <div className="hidden size-full dark:block" style={{ backgroundColor: bar.dark }} />
            <div className="size-full dark:hidden" style={{ backgroundColor: bar.light }} />
          </div>
        ))}
      </div>
    </section>
  );
}
