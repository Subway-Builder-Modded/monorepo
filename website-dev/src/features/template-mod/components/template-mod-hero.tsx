import { Button } from "@subway-builder-modded/shared-ui";
import { Package } from "lucide-react";
import { LightMarkdown } from "@/features/content/components/light-markdown";
import { resolveIcon } from "@subway-builder-modded/icons";
import { Link } from "@/lib/router";
import { HeroAccentBar } from "@/shared/components/hero-accent-bar";
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
      ? "h-11 rounded-xl border-[color-mix(in_srgb,var(--suite-accent-light)_42%,transparent)] px-6 text-base font-semibold text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] hover:text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_45%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)] dark:hover:text-[var(--suite-accent-dark)]"
      : "h-11 rounded-xl px-6 text-base font-semibold";

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
    <section className="relative flex h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] items-center overflow-visible border-b border-border/40 bg-background">
      <div className="pointer-events-none absolute -top-12 inset-x-0 bottom-0" aria-hidden={true}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,color-mix(in_srgb,var(--suite-accent-light)_26%,transparent),transparent_48%),radial-gradient(circle_at_84%_80%,color-mix(in_srgb,var(--suite-accent-dark)_24%,transparent),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/45 dark:from-slate-950/30 dark:to-black/60" />
      </div>

      <div className="relative z-10 grid w-full gap-8 px-5 sm:px-7 md:px-9 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center lg:gap-9 lg:px-12">
        <div className="origin-top-left scale-[0.85] space-y-6">
          <div className="space-y-3">
            <h1 className="flex items-center gap-3 text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.93] tracking-[-0.04em] text-foreground">
              <Package
                className="size-[0.9em] shrink-0 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
                aria-hidden={true}
              />
              <span>{TEMPLATE_MOD_TITLE}</span>
            </h1>
            <LightMarkdown className="max-w-[clamp(30rem,48vw,62rem)] text-[clamp(1rem,2vw,1.16rem)] leading-relaxed text-foreground/76">
              {TEMPLATE_MOD_HERO_COPY}
            </LightMarkdown>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <CtaButton cta={TEMPLATE_MOD_PRIMARY_CTA} iconClassName="size-5" />
            <CtaButton cta={TEMPLATE_MOD_SECONDARY_CTA} iconClassName="size-4.5" />
          </div>
        </div>

        <div className="w-full origin-top-right justify-self-end scale-[0.85] lg:translate-y-16">
          <TemplateModHeroWorkbench />
        </div>
      </div>

      <HeroAccentBar
        segments={[
          { light: "#5ea5fa", dark: "#95c5fd" },
          { light: "#3f89e8", dark: "#7db4fb" },
          { light: "#5ea5fa", dark: "#95c5fd" },
          { light: "#3f89e8", dark: "#7db4fb" },
          { light: "#5ea5fa", dark: "#95c5fd" },
        ]}
      />
    </section>
  );
}
