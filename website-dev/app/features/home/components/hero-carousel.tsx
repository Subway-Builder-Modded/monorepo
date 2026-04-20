import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/app/lib/utils";
import { FaDiscord } from "react-icons/fa";
import { GithubIcon } from "@subway-builder-modded/shared-ui";
import {
  HERO_SLIDES,
  HERO_AUTO_ROTATE_MS,
  HERO_SUITE_BARS,
  HERO_TITLE_LINE_1,
  HERO_TITLE_LINE_2,
  HERO_DESCRIPTION,
  HERO_CTA_GITHUB,
  HERO_CTA_DISCORD,
} from "@/app/config/home";
import { HeroCreditsTooltip } from "@/app/features/home/components/hero-credits-tooltip";

const HERO_BLUR_MASK =
  "radial-gradient(ellipse 70% 66% at 50% 50%, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.92) 20%, rgba(0,0,0,0.7) 42%, rgba(0,0,0,0.34) 68%, transparent 100%)";

function getHeroBlurLayerStyle(blurPx: number): CSSProperties {
  return {
    backdropFilter: `blur(${blurPx}px)`,
    WebkitBackdropFilter: `blur(${blurPx}px)`,
    maskImage: HERO_BLUR_MASK,
    WebkitMaskImage: HERO_BLUR_MASK,
  };
}

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

      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        <div
          className="absolute left-1/2 top-[53%] h-[clamp(22rem,46vw,46rem)] w-[clamp(22rem,46vw,46rem)] -translate-x-1/2 -translate-y-1/2 rounded-[3rem]"
          style={getHeroBlurLayerStyle(4)}
        />
        <div
          className="absolute left-1/2 top-[53%] h-[clamp(30rem,60vw,60rem)] w-[clamp(30rem,60vw,60rem)] -translate-x-1/2 -translate-y-1/2 rounded-[4.5rem] opacity-72"
          style={getHeroBlurLayerStyle(2.5)}
        />
        <div
          className="absolute left-1/2 top-[53%] h-[clamp(40rem,78vw,78rem)] w-[clamp(40rem,78vw,78rem)] -translate-x-1/2 -translate-y-1/2 rounded-[6.5rem] opacity-42"
          style={getHeroBlurLayerStyle(1.5)}
        />
        <div
          className="absolute left-1/2 top-[53%] h-[clamp(52rem,98vw,100rem)] w-[clamp(52rem,98vw,100rem)] -translate-x-1/2 -translate-y-1/2 rounded-[8rem] opacity-20"
          style={getHeroBlurLayerStyle(0.75)}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/80 via-background/25 via-40% to-transparent"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background/70 via-background/15 via-25% to-transparent"
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center text-center"
        style={prefersReducedMotion ? undefined : { y: contentY }}
      >
        <div className="max-w-3xl px-5 sm:px-7 min-[1920px]:max-w-[58rem]">
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

          <h1 className="text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.93] tracking-[-0.04em] text-foreground min-[1920px]:text-[clamp(4.6rem,4.5vw,6rem)] min-[2560px]:text-[clamp(5.2rem,4vw,7rem)]">
            {HERO_TITLE_LINE_1}
            <br />
            {HERO_TITLE_LINE_2}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-foreground/70 min-[1920px]:max-w-2xl min-[1920px]:text-[clamp(1.2rem,1.4vw,1.5rem)]">
            {HERO_DESCRIPTION}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <a
              href={HERO_CTA_GITHUB.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-foreground/90 px-6 py-3.5 text-[15px] font-bold tracking-[-0.01em] text-background shadow-lg backdrop-blur-sm transition-all hover:bg-foreground"
            >
              <GithubIcon className="size-[18px]" />
              {HERO_CTA_GITHUB.label}
            </a>
            <a
              href={HERO_CTA_DISCORD.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl border border-foreground/25 bg-foreground/5 px-6 py-3.5 text-[15px] font-bold tracking-[-0.01em] text-foreground/90 backdrop-blur-sm transition-all hover:border-foreground/40 hover:bg-foreground/10"
            >
              <FaDiscord className="size-[18px]" />
              {HERO_CTA_DISCORD.label}
            </a>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-5 left-5 z-20 sm:bottom-7 sm:left-7">
        <HeroCreditsTooltip slide={slide} />
      </div>

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
