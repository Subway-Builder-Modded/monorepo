import { Link } from "@/app/lib/router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SuiteNavCard } from "@/app/components/navigation/suite-nav-card";
import { SiteIcon } from "@/app/components/navigation/site-icon";
import { WEBSITE_DEV_SUITES } from "@/app/lib/site-navigation";

export function HomeDesignPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 p-6 sm:p-8 md:p-10">
        <div className="absolute inset-x-0 top-0 signage-line h-[2px]" aria-hidden="true" />
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-3xl"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Phase 1 Redesign
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Transit-grade wayfinding for a premium mod ecosystem.
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground sm:text-base">
            The new website-dev shell modernizes Subway Builder Modded with route-marker hierarchy,
            high-contrast information panels, and polished interaction motion inspired by East Asian
            subway signage systems.
          </p>
        </motion.div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {WEBSITE_DEV_SUITES.map((suite, index) => {
          const cardItem = suite.items[0];

          return (
            <motion.div
              key={suite.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.03 }}
            >
              <Link
                to={cardItem.href}
                className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div
                  style={{
                    ["--suite-accent-light" as string]: suite.accent.light,
                    ["--suite-accent-dark" as string]: suite.accent.dark,
                    ["--suite-text-inverted-light" as string]: suite.accent.textInvertedLight,
                    ["--suite-text-inverted-dark" as string]: suite.accent.textInvertedDark,
                  }}
                >
                  <SuiteNavCard suite={suite} item={cardItem} compact />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-border/80 bg-card/75 p-6 sm:p-8">
        <header className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight">Signage Panel Study</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            This section stress-tests hierarchy and card readability by combining route-marker
            scale, bilingual line labels, and software-grade spacing for product navigation.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          {WEBSITE_DEV_SUITES.slice(1).map((suite) => {
            const item = suite.items[0];
            return (
              <Link
                key={suite.id}
                to={item.href}
                className="group rounded-3xl border border-border/80 bg-background/70 p-4 transition hover:border-primary/35"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <SiteIcon iconKey={suite.iconKey} className="size-3.5" />
                    {suite.title}
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
                </div>

                <div
                  style={{
                    ["--suite-accent-light" as string]: suite.accent.light,
                    ["--suite-accent-dark" as string]: suite.accent.dark,
                    ["--suite-text-inverted-light" as string]: suite.accent.textInvertedLight,
                    ["--suite-text-inverted-dark" as string]: suite.accent.textInvertedDark,
                  }}
                >
                  <SuiteNavCard suite={suite} item={item} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
