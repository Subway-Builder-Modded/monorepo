import { Link } from "@/app/lib/router";
import type { SiteSuiteId } from "@/app/lib/site-navigation";
import { getSuiteById, WEBSITE_DEV_SUITES } from "@/app/lib/site-navigation";
import { SiteIcon } from "@/app/components/navigation/site-icon";

type SuiteOverviewPageProps = {
  suiteId: SiteSuiteId;
  headline: string;
  blurb: string;
};

export function SuiteOverviewPage({ suiteId, headline, blurb }: SuiteOverviewPageProps) {
  const suite = getSuiteById(suiteId);

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-sm sm:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <SiteIcon iconKey={suite.iconKey} className="size-3.5" />
          {suite.lineMarker.label}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{headline}</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{blurb}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-border/70 bg-card/75 p-5">
          <h2 className="text-lg font-semibold">Current Route</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This phase introduces a modernized shell, refined wayfinding hierarchy, and shared suite
            metadata.
          </p>
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/80 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Breadcrumb
            </div>
            <div className="mt-1 text-sm font-medium">
              {suite.title} / {suite.items[0].breadcrumb.join(" / ")}
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/75 p-5">
          <h2 className="text-lg font-semibold">Other Suites</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cross-suite handoff remains consistent through shared accents, cards, and floating
            wayfinding.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {WEBSITE_DEV_SUITES.filter((entry) => entry.id !== suite.id).map((entry) => (
              <Link
                key={entry.id}
                to={entry.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:text-primary"
              >
                <SiteIcon iconKey={entry.iconKey} className="size-3.5" />
                {entry.title}
              </Link>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
