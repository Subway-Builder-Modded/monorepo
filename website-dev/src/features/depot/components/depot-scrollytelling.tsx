import { memo, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { resolveIcon } from "@subway-builder-modded/icons";
import { SectionHeader, SectionShell } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { DEPOT_SCROLLYTELLING_CONTENT } from "@/features/depot/depot-content";
import type { DepotScrollytellingStep } from "@/features/depot/depot-types";
import { LightMarkdown } from "@/features/content/components/light-markdown";
import { useMediaQuery } from "@/hooks/use-media-query";
import { resolveAccentColor, useThemeMode } from "@/hooks/use-theme-mode";
import { cn } from "@/lib/utils";

const DEPOT_ACCENT = getSuiteById("depot").accent;

function DepotPipelineRail({
  steps,
  activeIdx,
  onSelect,
}: {
  steps: DepotScrollytellingStep[];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  const { resolvedTheme } = useThemeMode();
  const tone = resolveAccentColor(resolvedTheme, DEPOT_ACCENT);

  return (
    <nav className="relative" aria-label="Depot build stages">
      <div className="mb-4 border-b border-border/55 pb-3">
        <p className="text-lg font-extrabold tracking-[-0.02em] text-foreground lg:text-xl">
          The Depot Pipeline
        </p>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute bottom-2 left-[2rem] top-2 z-0 w-[6px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: "var(--border)" }}
          aria-hidden="true"
        />

        <div className="space-y-3">
          {steps.map((step, i) => {
            const isActive = i === activeIdx;
            const StepIcon = resolveIcon(step.icon);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect(i)}
                className={cn(
                  "group relative z-10 flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left transition-all duration-300",
                  isActive ? "bg-card shadow-sm" : "hover:border-border/60 hover:bg-muted/25",
                )}
                style={{
                  boxShadow: isActive ? `0 0 0 1px ${tone}20, 0 8px 24px ${tone}12` : undefined,
                }}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className="relative flex size-11 shrink-0 items-center justify-center rounded-full border-[3px]"
                  style={{
                    borderColor: isActive ? tone : "var(--border)",
                    backgroundColor: isActive ? `${tone}20` : "var(--card)",
                    color: isActive ? tone : "var(--muted-foreground)",
                  }}
                >
                  <StepIcon
                    className={cn("size-5", isActive && "drop-shadow-sm")}
                    aria-hidden={true}
                  />
                </span>

                <LightMarkdown className="min-w-0 text-sm font-medium text-foreground [&_p]:m-0 [&_p]:line-clamp-2 [&_p]:leading-snug [&_code]:text-[0.92em]">
                  {step.title}
                </LightMarkdown>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

const DepotStoryPanel = memo(function DepotStoryPanel({
  step,
  index,
}: {
  step: DepotScrollytellingStep;
  index: number;
}) {
  const { resolvedTheme } = useThemeMode();
  const tone = resolveAccentColor(resolvedTheme, DEPOT_ACCENT);
  const StepIcon = resolveIcon(step.icon);
  const reverseOnDesktop = index % 2 === 1;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-border/55 bg-card/55 backdrop-blur-sm"
      style={{ boxShadow: `0 0 0 1px ${tone}12, 0 14px 36px ${tone}10` }}
    >
      <div className="h-[5px] w-full" style={{ backgroundColor: tone }} aria-hidden="true" />

      <div
        className={cn(
          "grid items-stretch gap-0 lg:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)]",
          reverseOnDesktop && "lg:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]",
        )}
      >
        <div
          className={cn(
            "flex flex-col justify-center p-5 lg:p-6",
            reverseOnDesktop && "lg:order-2",
          )}
        >
          <div className="mb-2 flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/40"
              style={{ backgroundColor: `${tone}18`, color: tone }}
            >
              <StepIcon className="size-6" aria-hidden={true} />
            </span>

            <LightMarkdown className="text-xl font-extrabold tracking-[-0.03em] text-foreground lg:text-2xl [&_p]:text-inherit [&_strong]:text-inherit">
              {step.title}
            </LightMarkdown>
          </div>

          <ul className="mt-2 ml-[3.25rem] space-y-2.5">
            {step.bullets.map((bullet) => (
              <li key={bullet} className="relative pl-4 text-[15px] text-muted-foreground">
                <span
                  className="absolute left-0 top-[0.6rem] size-2 shrink-0 rotate-45 rounded-[2px]"
                  style={{ backgroundColor: tone }}
                  aria-hidden="true"
                />
                <LightMarkdown className="text-[15px] leading-relaxed text-muted-foreground [&_p:not(:first-child)]:mt-2">
                  {bullet}
                </LightMarkdown>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn(
            "relative border-t border-border/45 lg:border-l lg:border-t-0",
            reverseOnDesktop && "lg:order-1 lg:border-l-0 lg:border-r",
          )}
        >
          <img
            src={step.image.imageLight}
            alt={step.image.imageAlt}
            className="block w-full dark:hidden"
            loading="lazy"
            draggable={false}
          />
          <img
            src={step.image.imageDark}
            alt={step.image.imageAlt}
            className="hidden w-full dark:block"
            loading="lazy"
            draggable={false}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)_0%,transparent_60%)] dark:bg-[linear-gradient(145deg,color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)_0%,transparent_60%)]"
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  );
});

function MobileStack({ steps }: { steps: DepotScrollytellingStep[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-10">
      {steps.map((step, index) => (
        <DepotStoryPanel key={step.id} step={step} index={index} />
      ))}
    </div>
  );
}

function DesktopSwitcher({ steps }: { steps: DepotScrollytellingStep[] }) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;

    const updateActiveFromViewportCenter = () => {
      frame = 0;
      const panels = panelRefs.current;
      const viewportCenter = window.innerHeight / 2;

      let nearestIdx = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < panels.length; i += 1) {
        const panel = panels[i];
        if (!panel) continue;
        const rect = panel.getBoundingClientRect();
        const panelCenter = rect.top + rect.height / 2;
        const distance = Math.abs(panelCenter - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIdx = i;
        }
      }

      setActiveIdx((prev) => (prev === nearestIdx ? prev : nearestIdx));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveFromViewportCenter);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  function scrollToPanel(i: number) {
    panelRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="grid grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)] items-start gap-6 xl:gap-8 min-[1920px]:gap-10">
      <div className="sticky top-1/2 mt-44 -translate-y-1/2 self-start lg:mt-48">
        <div className="rounded-2xl border border-border/60 bg-card/65 p-4 shadow-sm backdrop-blur-sm">
          <DepotPipelineRail steps={steps} activeIdx={activeIdx} onSelect={scrollToPanel} />
        </div>
      </div>

      <div className="min-w-0 space-y-14 min-[1920px]:space-y-16">
        {steps.map((step, i) => (
          <div
            key={step.id}
            data-panel-index={i}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
          >
            {prefersReducedMotion ? (
              <DepotStoryPanel step={step} index={i} />
            ) : (
              <motion.div
                initial={{ opacity: 0.3, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-30% 0px -30% 0px", once: false }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <DepotStoryPanel step={step} index={i} />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DepotScrollytellingSection() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <SectionShell
      surfaced
      noBottomSpacing
      className="py-20 lg:py-32 bg-[radial-gradient(circle_at_82%_20%,color-mix(in_srgb,var(--suite-accent-light)_10%,transparent),transparent_40%)] dark:bg-[radial-gradient(circle_at_82%_20%,color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent),transparent_46%)]"
    >
      <SectionHeader
        title={DEPOT_SCROLLYTELLING_CONTENT.title}
        description={<LightMarkdown>{DEPOT_SCROLLYTELLING_CONTENT.description}</LightMarkdown>}
      />

      <div className="mt-16 lg:mt-24">
        {isDesktop ? (
          <DesktopSwitcher steps={DEPOT_SCROLLYTELLING_CONTENT.steps} />
        ) : (
          <MobileStack steps={DEPOT_SCROLLYTELLING_CONTENT.steps} />
        )}
      </div>
    </SectionShell>
  );
}
