import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/app/lib/utils";
import { FaDiscord } from "react-icons/fa";
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
  const idxRef = useRef(idx);
  idxRef.current = idx;

  usePreloadImages(slides);

  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 80]);
  const imgScale = useTransform(scrollY, [0, 600], [1, 1.06]);
  const contentY = useTransform(scrollY, [0, 500], [0, 40]);

  const go = useCallback(
    (n: number) => setIdx((n + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (!multi || paused || prefersReducedMotion) return;
    const timer = setInterval(() => go(idxRef.current + 1), HERO_AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [multi, paused, prefersReducedMotion, go]);

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
        go(idxRef.current - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(idxRef.current + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multi, go]);

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

      {/* Radial center blur for readability — emanates from center, dies off quickly */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          maskImage: "radial-gradient(ellipse 55% 50% at 50% 50%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 50% at 50% 50%, black 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Top darken gradient for nav readability */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/80 via-background/25 via-40% to-transparent"
        aria-hidden="true"
      />

      {/* Bottom brighten/darken gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background/70 via-background/15 via-25% to-transparent"
        aria-hidden="true"
      />

      {/* Content: centered */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center text-center"
        style={prefersReducedMotion ? undefined : { y: contentY }}
      >
        <div className="max-w-3xl px-5 sm:px-7">
          <div className="mb-5 flex items-center justify-center gap-1.5" aria-hidden="true">
            {HERO_SUITE_BARS.map((c, i) => (
              <span
                key={i}
                className="hidden h-1 w-10 rounded-sm dark:block sm:w-12"
                style={{ backgroundColor: c.dark }}
              />
            ))}
            {HERO_SUITE_BARS.map((c, i) => (
              <span
                key={`l${i}`}
                className="block h-1 w-10 rounded-sm dark:hidden sm:w-12"
                style={{ backgroundColor: c.light }}
              />
            ))}
          </div>

          <h1 className="text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.93] tracking-[-0.04em] text-foreground">
            Subway Builder
            <br />
            Modded
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-foreground/70">
            The complete hub for everything modded in Subway Builder.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <a
              href="https://github.com/Subway-Builder-Modded"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-foreground/90 px-6 py-3.5 text-[15px] font-bold tracking-[-0.01em] text-background shadow-lg backdrop-blur-sm transition-all hover:bg-foreground"
            >
              <GithubIcon className="size-[18px]" />
              GitHub
            </a>
            <a
              href="https://discord.gg/syG9YHMyeG"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl border border-foreground/25 bg-foreground/5 px-6 py-3.5 text-[15px] font-bold tracking-[-0.01em] text-foreground/90 backdrop-blur-sm transition-all hover:border-foreground/40 hover:bg-foreground/10"
            >
              <FaDiscord className="size-[18px]" />
              Discord
            </a>
          </div>
        </div>
      </motion.div>

      {/* Bottom-left: info icon — corner-pinned */}
      <div className="absolute bottom-5 left-5 z-20 sm:bottom-7 sm:left-7">
        <HeroCreditsTooltip slide={slide} />
      </div>

      {/* Bottom-right: slide controls — corner-pinned */}
      {multi && (
        <div
          className="absolute bottom-5 right-5 z-20 flex items-center gap-2 sm:bottom-7 sm:right-7"
          role="tablist"
          aria-label="Hero slides"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "relative size-3 rounded-full border-2 transition-all duration-300",
                i === idx
                  ? "scale-125 border-foreground bg-foreground"
                  : "border-foreground/40 bg-transparent hover:border-foreground/70",
              )}
            />
          ))}
        </div>
      )}

      {/* Suite-colored bottom rail */}
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
