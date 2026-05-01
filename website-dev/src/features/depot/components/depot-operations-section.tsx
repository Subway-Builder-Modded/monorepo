import { Card, CardContent, SectionHeader, SectionShell } from "@subway-builder-modded/shared-ui";
import { resolveIcon } from "@subway-builder-modded/icons";
import { DEPOT_OPERATIONS_CONTENT } from "@/features/depot/depot-content";
import { LightMarkdown } from "@/features/content/components/light-markdown";

export function DepotOperationsSection() {
  return (
    <SectionShell
      surfaced
      className="py-18 lg:py-24 bg-[radial-gradient(circle_at_16%_30%,color-mix(in_srgb,var(--suite-accent-light)_12%,transparent),transparent_54%)] dark:bg-[radial-gradient(circle_at_16%_30%,color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent),transparent_58%)]"
    >
      <SectionHeader
        title={DEPOT_OPERATIONS_CONTENT.title}
        description={<LightMarkdown>{DEPOT_OPERATIONS_CONTENT.description}</LightMarkdown>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {DEPOT_OPERATIONS_CONTENT.cards.map((card) => {
          const CardIcon = resolveIcon(card.icon);

          return (
            <Card
              key={card.id}
              className="h-full rounded-2xl border-border/60 bg-card/70 shadow-sm backdrop-blur-sm"
            >
              <CardContent className="flex h-full flex-col p-5 lg:p-6">
                <div className="mb-3 flex min-h-12 items-center gap-2.5">
                  <span className="rounded-lg border border-border/50 bg-background/70 p-2 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]">
                    <CardIcon className="size-4.5" aria-hidden={true} />
                  </span>
                  <h3 className="text-[1.05rem] font-bold tracking-[-0.02em] text-foreground">
                    {card.title}
                  </h3>
                </div>

                <div className="flex-1">
                  <LightMarkdown className="text-sm leading-relaxed text-muted-foreground [&_p:not(:first-child)]:mt-2">
                    {card.description}
                  </LightMarkdown>
                </div>

                <ul className="mt-4 space-y-2">
                  {card.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span
                        className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-[var(--suite-accent-light)] dark:bg-[var(--suite-accent-dark)]"
                        aria-hidden={true}
                      />
                      <LightMarkdown className="[&_p:not(:first-child)]:mt-1">
                        {bullet}
                      </LightMarkdown>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </SectionShell>
  );
}
