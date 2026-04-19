import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Link } from "@/app/lib/router";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import { useThemeMode } from "@/app/hooks/use-theme-mode";
import { CodeDisplay, SectionHeader, SectionShell } from "@subway-builder-modded/shared-ui";
import {
  getHomeIcon,
  getHomepageSuiteAccent,
  SUITE_SCROLLYTELLING_SECTION,
  SUITE_STEPS,
  type SuiteStep,
} from "@/app/features/home/data/homepage-content";

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
        const accent = getHomepageSuiteAccent(step.accentSuiteId);
        const tone = isDark ? accent.dark : accent.light;
        const StepIcon = getHomeIcon(step.icon);

        return (
          <div key={step.id} className="flex flex-col items-center">
            {i > 0 && (
              <div
                className="w-[3px] rounded-full"
                style={{
                  height: 36,
                  backgroundColor: "var(--border)",
                }}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "relative flex size-14 items-center justify-center rounded-xl border-2 transition-all duration-300 xl:size-16",
                isActive ? "scale-110 shadow-lg" : "hover:scale-105",
              )}
              style={{
                borderColor: isActive ? tone : "var(--border)",
                backgroundColor: isActive ? `${tone}20` : "var(--card)",
                color: isActive ? tone : "var(--muted-foreground)",
                boxShadow: isActive ? `0 4px 20px ${tone}25` : undefined,
              }}
              aria-current={isActive ? "step" : undefined}
              aria-label={step.title}
            >
              <StepIcon
                className={cn("size-5 xl:size-6", isActive && "drop-shadow-sm")}
                aria-hidden="true"
              />
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
  const accent = getHomepageSuiteAccent(step.accentSuiteId);
  const tone = isDark ? accent.dark : accent.light;
  const StepIcon = getHomeIcon(step.icon);
  const PrimaryIcon = getHomeIcon(step.primaryAction.icon);
  const SecondaryIcon = getHomeIcon(step.secondaryAction.icon);

  return (
    <div className="flex min-w-0 flex-col">
      {step.media.kind === "code" ? (
        <CodeDisplay
          code={step.media.code.content}
          lang={step.media.code.lang}
          title={step.media.code.fileName}
          resolvedTheme={resolvedTheme}
          className="mb-6 w-full min-w-0"
          style={{ boxShadow: `0 0 0 1px ${tone}10, 0 8px 30px ${tone}08` }}
        />
      ) : (
        <div
          className="relative mb-6 overflow-hidden rounded-xl border border-border/40 bg-muted/30"
          style={{ boxShadow: `0 0 0 1px ${tone}10, 0 8px 30px ${tone}08` }}
        >
          <div className="h-[3px] w-full" style={{ backgroundColor: tone }} aria-hidden="true" />
          <div className="relative aspect-video">
            <img
              src={step.media.imageLight}
              alt={step.media.imageAlt}
              className="absolute inset-0 block size-full object-cover object-top dark:hidden"
              loading="lazy"
              draggable={false}
            />
            <img
              src={step.media.imageDark}
              alt={step.media.imageAlt}
              className="absolute inset-0 hidden size-full object-cover object-top dark:block"
              loading="lazy"
              draggable={false}
            />
          </div>
        </div>
      )}

      <div className="mb-2.5 flex items-center gap-3">
        <span
          className="flex size-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tone}18`, color: tone }}
        >
          <StepIcon className="size-4" aria-hidden="true" />
        </span>
        <h3 className="text-xl font-extrabold tracking-[-0.03em] text-foreground lg:text-2xl">
          {step.title}
        </h3>
      </div>

      <p className="text-[15px] leading-relaxed text-muted-foreground">{step.description}</p>

      <ul className="mt-4 space-y-2">
        {step.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[15px] text-muted-foreground">
            <span
              className="mt-[7px] size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: tone }}
              aria-hidden="true"
            />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          to={step.primaryAction.href}
          className="inline-flex items-center gap-2 rounded-lg border border-transparent px-6 py-3 text-sm font-bold tracking-[-0.01em] shadow-sm transition-all hover:brightness-110"
          style={{ backgroundColor: tone, color: "var(--background)" }}
        >
          <PrimaryIcon className="size-4" aria-hidden="true" />
          {step.primaryAction.label}
        </Link>
        {step.secondaryAction.external ? (
          <a
            href={step.secondaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            <SecondaryIcon className="size-4" aria-hidden="true" />
            {step.secondaryAction.label}
            <ExternalLink className="size-3 opacity-50" aria-hidden="true" />
          </a>
        ) : (
          <Link
            to={step.secondaryAction.href}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            <SecondaryIcon className="size-4" aria-hidden="true" />
            {step.secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function MobileStack({ steps }: { steps: SuiteStep[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-12 sm:space-y-14">
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
    <div className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-10 xl:grid-cols-[96px_minmax(0,1fr)] xl:gap-14 min-[1920px]:gap-20">
      <div className="sticky top-[calc(50vh-160px)] flex justify-center self-start">
        <StationSwitcher steps={steps} activeIdx={activeIdx} onSelect={scrollToPanel} />
      </div>

      <div className="min-w-0 space-y-24 min-[1920px]:space-y-28">
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
                  initial={{ opacity: 0.3, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ margin: "-30% 0px -30% 0px", once: false }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
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
    <SectionShell surfaced className="pt-20 pb-10 lg:pt-32 lg:pb-16">
      <SectionHeader
        title={SUITE_SCROLLYTELLING_SECTION.title}
        description={SUITE_SCROLLYTELLING_SECTION.description}
      />

      <div className="mt-12 lg:mt-16">
        {isDesktop ? <DesktopSwitcher steps={steps} /> : <MobileStack steps={steps} />}
      </div>
    </SectionShell>
  );
}
