import { Button } from "@subway-builder-modded/shared-ui";
import { Package } from "lucide-react";
import { LightMarkdown } from "@/features/content/components/light-markdown";
import { resolveIcon } from "@subway-builder-modded/icons";
import { Link } from "@/lib/router";
import {
  TEMPLATE_MOD_HERO_COPY,
  TEMPLATE_MOD_TITLE,
  TEMPLATE_MOD_PRIMARY_CTA,
  TEMPLATE_MOD_SECONDARY_CTA,
} from "@/features/template-mod/template-mod-content";
import type { TemplateModCta } from "@/features/template-mod/template-mod-types";
import { TemplateModHeroWorkbench } from "@/features/template-mod/components/template-mod-hero-workbench";

function CtaButton({ cta, iconClassName }: { cta: TemplateModCta; iconClassName: string }) {
  const Icon = resolveIcon(cta.icon);
  const variant = cta.style === "outline" ? "outline" : undefined;
  const className =
    cta.style === "outline"
      ? "h-12 px-6 text-sm font-semibold"
      : "h-12 px-7 text-sm font-bold tracking-[-0.01em]";

  if (cta.external) {
    return (
      <Button asChild size="lg" variant={variant} className={className}>
        <a href={cta.href} target="_blank" rel="noreferrer noopener">
          <Icon className={iconClassName} aria-hidden={true} />
          {cta.label}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild size="lg" variant={variant} className={className}>
      <Link to={cta.href}>
        <Icon className={iconClassName} aria-hidden={true} />
        {cta.label}
      </Link>
    </Button>
  );
}

export function TemplateModHero() {
  return (
    <section className="relative flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] items-center overflow-visible border-b border-border/45 bg-background">
      <div className="pointer-events-none absolute -top-12 inset-x-0 bottom-0" aria-hidden={true}>
        {" "}
        {/* Route map background */}
        <img
          src="/assets/geojson/SPK.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 dark:opacity-25 [filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--suite-accent-light)_70%,transparent))_drop-shadow(0_0_6px_color-mix(in_srgb,var(--suite-accent-light)_50%,transparent))] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--suite-accent-dark)_70%,transparent))_drop-shadow(0_0_6px_color-mix(in_srgb,var(--suite-accent-dark)_50%,transparent))]"
          draggable={false}
        />{" "}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent),transparent_58%)] dark:bg-[radial-gradient(circle_at_22%_28%,color-mix(in_srgb,var(--suite-accent-dark)_28%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-light)_24%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)_1px,transparent_1px)] bg-[length:100%_100%,56px_56px,56px_56px] dark:bg-[linear-gradient(transparent_0%,transparent_96%,color-mix(in_srgb,var(--suite-accent-dark)_30%,transparent)_100%),linear-gradient(90deg,color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_srgb,var(--suite-accent-dark)_26%,transparent)_1px,transparent_1px)]" />
      </div>

      <div className="relative z-10 grid w-full gap-8 px-5 sm:px-7 md:px-9 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center lg:gap-9 lg:px-12">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="flex items-center gap-3 whitespace-nowrap text-[clamp(2.8rem,7vw,5.6rem)] font-extrabold tracking-[-0.05em] text-foreground">
              <Package
                className="size-[0.85em] shrink-0 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                aria-hidden={true}
              />
              <span>{TEMPLATE_MOD_TITLE}</span>
            </h1>
            <LightMarkdown className="max-w-lg text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed text-foreground/82">
              {TEMPLATE_MOD_HERO_COPY}
            </LightMarkdown>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <CtaButton cta={TEMPLATE_MOD_PRIMARY_CTA} iconClassName="size-4.5" />
            <CtaButton cta={TEMPLATE_MOD_SECONDARY_CTA} iconClassName="size-4.5" />
          </div>
        </div>

        <div className="w-full origin-top-right justify-self-end scale-[0.85] lg:translate-y-16">
          <TemplateModHeroWorkbench />
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)]"
        aria-hidden={true}
      />
    </section>
  );
}
