import { Button, Card, CardContent, SectionShell } from "@subway-builder-modded/shared-ui";
import { resolveIcon } from "@subway-builder-modded/icons";
import { DEPOT_FINAL_CTA_CONTENT } from "@/features/depot/depot-content";
import type { DepotHeroCta } from "@/features/depot/depot-types";
import { LightMarkdown } from "@/features/content/components/light-markdown";
import { Link } from "@/lib/router";

function DepotCtaButton({ cta }: { cta: DepotHeroCta }) {
  const Icon = resolveIcon(cta.icon);
  const variant = cta.variant === "outline" ? "outline" : undefined;
  const className =
    cta.variant === "outline"
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

export function DepotFinalCta() {
  return (
    <SectionShell className="pt-0 pb-16 lg:pb-20">
      <Card className="rounded-3xl border-border/55 bg-card/75">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              {DEPOT_FINAL_CTA_CONTENT.title}
            </h2>
            <LightMarkdown className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {DEPOT_FINAL_CTA_CONTENT.description}
            </LightMarkdown>
          </div>

          <div className="flex flex-wrap gap-2">
            <DepotCtaButton cta={DEPOT_FINAL_CTA_CONTENT.primaryCta} />
            <DepotCtaButton cta={DEPOT_FINAL_CTA_CONTENT.secondaryCta} />
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}
