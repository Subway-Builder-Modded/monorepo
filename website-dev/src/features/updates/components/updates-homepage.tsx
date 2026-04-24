import { useMemo } from "react";
import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { ChevronRight } from "lucide-react";
import { getSuiteById } from "@/config/site-navigation";
import {
  getUpdatesSuiteConfig,
  UPDATES_HOMEPAGE_ICON,
  UPDATES_HOMEPAGE_TITLE,
  type UpdatesSuiteId,
} from "@/config/updates";
import { getUpdatesEntries } from "@/features/updates/lib/content";
import { getUpdatePageUrl } from "@/features/updates/lib/routing";
import { formatUpdateDisplayId } from "@/features/updates/lib/formatting";
import { resolveLucideIcon } from "@/features/content/lib/icon-resolver";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import { resolveHeadingActions } from "@/config/shared/heading-actions";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import { LatestReleaseChip, TagChip } from "./tag-badges";
import { getUpdatesHomepageIdentity } from "@/features/updates/lib/identity";

export function UpdatesHomepage({ suiteId }: { suiteId: UpdatesSuiteId }) {
  const suite = getSuiteById(suiteId);
  const entries = useMemo(() => getUpdatesEntries(suiteId), [suiteId]);
  const latestEntry = entries[0] ?? null;
  const suiteConfig = getUpdatesSuiteConfig(suiteId);
  const identity = getUpdatesHomepageIdentity(suiteId);
  const headingActions = resolveHeadingActions(suiteConfig?.homepage.actions, { suiteId });

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-6 lg:py-8">
        <FeatureHomepageHeading
          icon={UPDATES_HOMEPAGE_ICON}
          title={UPDATES_HOMEPAGE_TITLE}
          description={identity.description}
          suiteId={suiteId}
          actions={headingActions}
        />

        <div className="mb-4 flex items-center gap-2.5" aria-label="Updates directory">
          <UPDATES_HOMEPAGE_ICON
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Releases
          </span>
          <div className="h-px flex-1 bg-border/60" aria-hidden="true" />
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No update entries found for this suite.</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const Icon = resolveLucideIcon(entry.frontmatter.icon);
              const isLatest = latestEntry?.id === entry.id;
              return (
                <Link
                  key={entry.id}
                  to={getUpdatePageUrl(suiteId, entry.id)}
                  className={cn(
                    "group block rounded-xl border-2 border-border/60 bg-background/70 transition-all",
                    "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_7%,transparent)]",
                    "dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_10%,transparent)]",
                  )}
                >
                  <div className="flex items-start gap-3 rounded-[0.7rem] px-3.5 py-3">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--suite-accent-light)] opacity-80 transition-opacity group-hover:opacity-95 dark:text-[var(--suite-accent-dark)]">
                      <Icon className="size-5" aria-hidden={true} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-base font-bold leading-tight text-foreground">
                          {entry.frontmatter.title}
                        </p>
                        <TagChip tag={entry.frontmatter.tag} />
                        {isLatest ? <LatestReleaseChip /> : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {formatUpdateDisplayId(entry.id)} • {entry.frontmatter.date}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-60"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </SuiteAccentScope>
  );
}
