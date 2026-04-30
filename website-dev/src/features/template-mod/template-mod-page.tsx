import {
  Button,
  Card,
  CardContent,
  SectionShell,
  SuiteAccentScope,
} from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { LightMarkdown } from "@/features/content/components/light-markdown";
import { resolveLucideIcon as resolveIcon } from "@/features/content/lib/icon-resolver";
import { Link } from "@/lib/router";
import {
  TEMPLATE_MOD_PRIMARY_CTA,
  TEMPLATE_MOD_SECONDARY_CTA,
} from "@/features/template-mod/template-mod-content";
import type { TemplateModCta } from "@/features/template-mod/template-mod-types";
import { TemplateModHero } from "@/features/template-mod/components/template-mod-hero";
import { TemplateModFoundationGrid } from "@/features/template-mod/components/template-mod-foundation-grid";
import { TemplateModCodePreview } from "@/features/template-mod/components/template-mod-code-preview";

function CompactCtaButton({ cta }: { cta: TemplateModCta }) {
  const Icon = resolveIcon(cta.icon);
  const variant = cta.style === "outline" ? "outline" : undefined;
  const className =
    cta.style === "outline"
      ? "rounded-lg border-[color-mix(in_srgb,var(--suite-accent-light)_42%,transparent)] text-[var(--suite-accent-light)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] hover:text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_45%,transparent)] dark:text-[var(--suite-accent-dark)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)] dark:hover:text-[var(--suite-accent-dark)]"
      : "rounded-lg";

  if (cta.external) {
    return (
      <Button asChild size="sm" variant={variant} className={className}>
        <a href={cta.href} target="_blank" rel="noreferrer noopener">
          <Icon className="size-4" aria-hidden={true} />
          {cta.label}
        </a>
      </Button>
    );
  }

  return (
    <Button asChild size="sm" variant={variant} className={className}>
      <Link to={cta.href}>
        <Icon className="size-4" aria-hidden={true} />
        {cta.label}
      </Link>
    </Button>
  );
}

export function TemplateModPage() {
  const suite = getSuiteById("template-mod");

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <TemplateModHero />
      <TemplateModFoundationGrid />
      <TemplateModCodePreview />

      <SectionShell>
        <Card className="rounded-3xl border-border/55 bg-card/75">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Create A High-Quality Mod Today</h2>
              <LightMarkdown className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                The Template Mod makes it easy to get started with mod development, so you can focus on building the best mod possible without worrying about setup and configuration.
              </LightMarkdown>
            </div>

            <div className="flex flex-wrap gap-2">
              <CompactCtaButton cta={TEMPLATE_MOD_PRIMARY_CTA} />
              <CompactCtaButton cta={TEMPLATE_MOD_SECONDARY_CTA} />
            </div>
          </CardContent>
        </Card>
      </SectionShell>
    </SuiteAccentScope>
  );
}
