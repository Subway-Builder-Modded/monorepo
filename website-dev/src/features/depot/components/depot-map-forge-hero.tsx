import { Button } from "@subway-builder-modded/shared-ui";
import { resolveIcon } from "@subway-builder-modded/icons";
import { Warehouse } from "lucide-react";
import { DEPOT_HERO_CONTENT } from "@/features/depot/depot-content";

export function DepotMapForgeHero() {
  const PrimaryIcon = resolveIcon(DEPOT_HERO_CONTENT.primaryCta.icon);
  const SecondaryIcon = resolveIcon(DEPOT_HERO_CONTENT.secondaryCta.icon);

  return (
    <section className="relative flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] items-center overflow-visible border-b border-border/45 bg-background">
      <div className="pointer-events-none absolute -top-12 inset-x-0 bottom-0" aria-hidden={true}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent),transparent_58%)] dark:bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-dark)_28%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px)] bg-[length:100%_100%,56px_56px,56px_56px] dark:bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-dark)_30%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px)]" />
      </div>

      <div className="relative z-10 grid gap-8 px-5 sm:px-7 md:px-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:px-12">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="flex items-center gap-3 text-[clamp(2.8rem,7vw,5.6rem)] font-extrabold tracking-[-0.05em] text-foreground">
              <Warehouse
                className="size-[0.85em] text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                aria-hidden={true}
              />
              <span>{DEPOT_HERO_CONTENT.title}</span>
            </h1>
            <p className="max-w-lg text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed text-foreground/82">
              {DEPOT_HERO_CONTENT.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              asChild
              variant={DEPOT_HERO_CONTENT.primaryCta.variant === "solid" ? "default" : "outline"}
              size="lg"
              className="h-12 px-7 text-sm font-bold tracking-[-0.01em]"
            >
              <a
                href={DEPOT_HERO_CONTENT.primaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PrimaryIcon className="size-4.5" aria-hidden={true} />
                {DEPOT_HERO_CONTENT.primaryCta.label}
              </a>
            </Button>

            <Button
              asChild
              variant={DEPOT_HERO_CONTENT.secondaryCta.variant === "solid" ? "default" : "outline"}
              size="lg"
              className="h-12 px-6 text-sm font-semibold"
            >
              <a
                href={DEPOT_HERO_CONTENT.secondaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SecondaryIcon className="size-4.5" aria-hidden={true} />
                {DEPOT_HERO_CONTENT.secondaryCta.label}
              </a>
            </Button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full overflow-hidden rounded-lg border border-border/45 bg-card shadow-lg dark:shadow-2xl">
            <img
              src="/images/depot/hero-light.png"
              alt="Depot hero map illustration"
              className="w-full dark:hidden"
            />
            <img
              src="/images/depot/hero-dark.png"
              alt="Depot hero map illustration"
              className="hidden w-full dark:block"
            />
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)]"
        aria-hidden={true}
      />
    </section>
  );
}
