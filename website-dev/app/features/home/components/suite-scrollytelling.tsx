import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { SUITE_STEPS, type SuiteStep } from "@/app/features/home/data/homepage-content";

const SHELL = "mx-auto w-full max-w-[1360px] px-5 sm:px-7 lg:px-10 xl:px-12";

/* ================================================================== */
/*  ROUTE RAIL — desktop vertical timeline with suite stops            */
/* ================================================================== */

function SuiteRouteRail({
  steps,
  activeIdx,
  onSelect,
}: {
  steps: SuiteStep[];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <nav className="relative flex flex-col" aria-label="Suite navigation">
      {/* Vertical track line */}
      <div className="absolute left-[11px] top-0 h-full w-0.5 bg-border/50" aria-hidden="true" />

      {/* Active segment highlight */}
      <motion.div
        className="absolute left-[11px] w-0.5 rounded-full"
        style={{ backgroundColor: steps[activeIdx].accent.dark }}
        animate={{
          top: `${(activeIdx / steps.length) * 100}%`,
          height: `${100 / steps.length}%`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        aria-hidden="true"
      />

      {steps.map((step, i) => {
        const isActive = i === activeIdx;
        return (
          <button
            key={step.id}
            type="button"
            className={cn(
              "group relative flex items-center gap-3.5 py-3.5 text-left transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
            )}
            onClick={() => onSelect(i)}
            aria-current={isActive ? "step" : undefined}
          >
            {/* Stop dot */}
            <span
              className={cn(
                "relative z-10 flex size-[23px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isActive
                  ? "border-transparent"
                  : "border-border bg-background group-hover:border-muted-foreground/40",
              )}
              style={
                isActive
                  ? { backgroundColor: step.accent.dark, borderColor: step.accent.dark }
                  : undefined
              }
            >
              {isActive && (
                <span className="size-1.5 rounded-full bg-background" aria-hidden="true" />
              )}
            </span>

            {/* Label */}
            <span
              className={cn(
                "text-sm font-semibold transition-colors",
                isActive && "text-foreground",
              )}
            >
              {step.title}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ================================================================== */
/*  STORY PANEL — content pane for one suite step                      */
/* ================================================================== */

function SuiteStoryPanel({ step, className }: { step: SuiteStep; className?: string }) {
  const PrimaryIcon = step.primaryAction.icon;
  const SecondaryIcon = step.secondaryAction.icon;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Preview image */}
      <div
        className="relative mb-5 overflow-hidden rounded-xl border border-border/40 bg-muted/30"
        style={{ boxShadow: `0 0 0 1px ${step.accent.dark}15, 0 8px 30px ${step.accent.dark}10` }}
      >
        <div
          className="h-[3px] w-full"
          style={{ backgroundColor: step.accent.dark }}
          aria-hidden="true"
        />
        <div className="relative aspect-video">
          <img
            src={step.imageLight}
            alt={step.imageAlt}
            className="absolute inset-0 block h-full w-full object-cover object-top dark:hidden"
            loading="lazy"
            draggable={false}
          />
          <img
            src={step.imageDark}
            alt={step.imageAlt}
            className="absolute inset-0 hidden h-full w-full object-cover object-top dark:block"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>

      {/* Copy */}
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="flex size-7 items-center justify-center rounded-md"
          style={{ backgroundColor: `${step.accent.dark}18`, color: step.accent.dark }}
        >
          <step.icon className="size-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-bold tracking-tight text-foreground">{step.title}</h3>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>

      <ul className="mt-3 space-y-1.5">
        {step.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span
              className="mt-[7px] size-1 shrink-0 rounded-full"
              style={{ backgroundColor: step.accent.dark }}
              aria-hidden="true"
            />
            {b}
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Link
          to={step.primaryAction.href}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors",
            "bg-foreground text-background hover:bg-foreground/90",
          )}
        >
          <PrimaryIcon className="size-3.5" aria-hidden="true" />
          {step.primaryAction.label}
        </Link>
        {step.secondaryAction.external ? (
          <a
            href={step.secondaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              "border-border text-foreground hover:bg-muted/50",
            )}
          >
            <SecondaryIcon className="size-3.5" aria-hidden="true" />
            {step.secondaryAction.label}
            <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
          </a>
        ) : (
          <Link
            to={step.secondaryAction.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              "border-border text-foreground hover:bg-muted/50",
            )}
          >
            <SecondaryIcon className="size-3.5" aria-hidden="true" />
            {step.secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MOBILE STACK — stacked suite cards for small viewports             */
/* ================================================================== */

function SuiteMobileStack({ steps }: { steps: SuiteStep[] }) {
  return (
    <div className="space-y-8">
      {steps.map((step) => (
        <SuiteStoryPanel key={step.id} step={step} />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  DESKTOP STICKY — pinned split-view scrollytelling                  */
/* ================================================================== */

function SuiteDesktopSticky({ steps }: { steps: SuiteStep[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* Scroll-driven active step detection via IntersectionObserver */
  useEffect(() => {
    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
    if (panels.length === 0) return;

    const ob = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = panels.indexOf(entry.target as HTMLDivElement);
            if (i !== -1) setActiveIdx(i);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    for (const p of panels) ob.observe(p);
    return () => ob.disconnect();
  }, []);

  function scrollToPanel(i: number) {
    panelRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="grid grid-cols-[200px_1fr] items-start gap-10 xl:grid-cols-[220px_1fr] xl:gap-14">
      {/* Left: sticky rail */}
      <div className="sticky top-[calc(50%-100px)] self-start">
        <SuiteRouteRail steps={steps} activeIdx={activeIdx} onSelect={scrollToPanel} />
      </div>

      {/* Right: scrolling panels */}
      <div className="space-y-16">
        {steps.map((step, i) => (
          <div
            key={step.id}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
          >
            <AnimatePresence mode="wait">
              {prefersReducedMotion ? (
                <SuiteStoryPanel step={step} />
              ) : (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.4, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ margin: "-30% 0px -30% 0px", once: false }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <SuiteStoryPanel step={step} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  EXPORTED SECTION                                                   */
/* ================================================================== */

export function SuiteScrollytellingSection() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const steps = SUITE_STEPS;

  return (
    <section className="relative py-16 lg:py-24">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-muted/20" aria-hidden="true" />

      <div className={cn("relative", SHELL)}>
        {/* Header */}
        <div className="mb-10 lg:mb-14">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-0.5 w-5 rounded-full bg-foreground/25" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              The Suite
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Four projects, one ecosystem
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Each project in the Subway Builder Modded suite handles a different part of the modding
            experience — from downloading and managing content to creating and publishing it.
          </p>
        </div>

        {/* Responsive layout */}
        {isDesktop ? <SuiteDesktopSticky steps={steps} /> : <SuiteMobileStack steps={steps} />}
      </div>
    </section>
  );
}
