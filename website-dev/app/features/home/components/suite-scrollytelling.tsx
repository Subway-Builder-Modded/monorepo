import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { useThemeMode } from "@/app/hooks/use-theme-mode";
import { SectionHeader } from "@subway-builder-modded/shared-ui";
import { SUITE_STEPS, type SuiteStep } from "@/app/features/home/data/homepage-content";

const HOMEPAGE_SHELL = "mx-auto w-full max-w-[1600px] px-5 sm:px-7 lg:px-10 xl:px-12";

function StationSwitcher({
  steps,
  activeIdx,
  onSelect,
}: {
  steps: SuiteStep[];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";

  return (
    <nav className="relative flex flex-col items-center" aria-label="Suite navigation">
      {steps.map((step, i) => {
        const isActive = i === activeIdx;
        const accent = isDark ? step.accent.dark : step.accent.light;
        const StepIcon = step.icon;

        return (
          <div key={step.id} className="flex flex-col items-center">
            {i > 0 && (
              <div
                className="w-0.5 transition-colors"
                style={{
                  height: 28,
                  backgroundColor: i <= activeIdx ? accent : "var(--border)",
                }}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "relative flex size-10 items-center justify-center rounded-lg border-2 transition-all",
                isActive ? "scale-110" : "hover:scale-105",
              )}
              style={{
                borderColor: isActive ? accent : "var(--border)",
                backgroundColor: isActive ? `${accent}18` : "var(--card)",
                color: isActive ? accent : "var(--muted-foreground)",
              }}
              aria-current={isActive ? "step" : undefined}
              aria-label={step.title}
            >
              <StepIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function StoryPanel({ step }: { step: SuiteStep }) {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === "dark";
  const accent = isDark ? step.accent.dark : step.accent.light;
  const PrimaryIcon = step.primaryAction.icon;
  const SecondaryIcon = step.secondaryAction.icon;

  return (
    <div className="flex flex-col">
      <div
        className="relative mb-5 overflow-hidden rounded-xl border border-border/40 bg-muted/30"
        style={{ boxShadow: `0 0 0 1px ${accent}15, 0 8px 30px ${accent}10` }}
      >
        <div className="h-[3px] w-full" style={{ backgroundColor: accent }} aria-hidden="true" />
        <div className="relative aspect-video">
          <img
            src={step.imageLight}
            alt={step.imageAlt}
            className="absolute inset-0 block size-full object-cover object-top dark:hidden"
            loading="lazy"
            draggable={false}
          />
          <img
            src={step.imageDark}
            alt={step.imageAlt}
            className="absolute inset-0 hidden size-full object-cover object-top dark:block"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2.5">
        <span
          className="flex size-7 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          <step.icon className="size-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-extrabold tracking-[-0.02em] text-foreground">{step.title}</h3>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>

      <ul className="mt-3 space-y-1.5">
        {step.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span
              className="mt-[7px] size-1 shrink-0 rounded-full"
              style={{ backgroundColor: accent }}
              aria-hidden="true"
            />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Link
          to={step.primaryAction.href}
          className="inline-flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: accent, color: "#fff" }}
        >
          <PrimaryIcon className="size-3.5" aria-hidden="true" />
          {step.primaryAction.label}
        </Link>
        {step.secondaryAction.external ? (
          <a
            href={step.secondaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            <SecondaryIcon className="size-3.5" aria-hidden="true" />
            {step.secondaryAction.label}
            <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
          </a>
        ) : (
          <Link
            to={step.secondaryAction.href}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            <SecondaryIcon className="size-3.5" aria-hidden="true" />
            {step.secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function MobileStack({ steps }: { steps: SuiteStep[] }) {
  return (
    <div className="space-y-10">
      {steps.map((step) => (
        <StoryPanel key={step.id} step={step} />
      ))}
    </div>
  );
}

function DesktopSwitcher({ steps }: { steps: SuiteStep[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    <div className="grid grid-cols-[56px_1fr] items-start gap-8 xl:gap-12">
      <div className="sticky top-[calc(50%-120px)] flex justify-center self-start">
        <StationSwitcher steps={steps} activeIdx={activeIdx} onSelect={scrollToPanel} />
      </div>

      <div className="space-y-20">
        {steps.map((step, i) => (
          <div
            key={step.id}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
          >
            {prefersReducedMotion ? (
              <StoryPanel step={step} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.4, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ margin: "-30% 0px -30% 0px", once: false }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <StoryPanel step={step} />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuiteScrollytellingSection() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const steps = SUITE_STEPS;

  return (
    <section className="relative py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-muted/20" aria-hidden="true" />

      <div className={cn("relative", HOMEPAGE_SHELL)}>
        <SectionHeader
          kicker="The Suite"
          title="Four projects, one ecosystem"
          description="Each project handles a different part of the modding experience — from downloading and managing content to creating and publishing it."
        />

        <div className="mt-10 lg:mt-14">
          {isDesktop ? <DesktopSwitcher steps={steps} /> : <MobileStack steps={steps} />}
        </div>
      </div>
    </section>
  );
}
