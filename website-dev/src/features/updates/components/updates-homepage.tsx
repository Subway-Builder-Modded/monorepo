import { useMemo } from "react";
import {
  SuiteAccentScope,
  SectionSeparator,
  DirectoryCard,
} from "@subway-builder-modded/shared-ui";
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

        <SectionSeparator label="Releases" icon={UPDATES_HOMEPAGE_ICON} />

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No update entries found for this suite.</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const Icon = resolveLucideIcon(entry.frontmatter.icon);
              const isLatest = latestEntry?.id === entry.id;
              return (
                <DirectoryCard
                  key={entry.id}
                  asChild
                  icon={<Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />}
                  heading={
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-base font-bold leading-tight text-foreground">
                        {entry.frontmatter.title}
                      </span>
                      <TagChip tag={entry.frontmatter.tag} />
                      {isLatest ? <LatestReleaseChip /> : null}
                    </span>
                  }
                  description={`${formatUpdateDisplayId(entry.id)} • ${entry.frontmatter.date}`}
                  descriptionClassName="text-xs"
                >
                  <Link to={getUpdatePageUrl(suiteId, entry.id)}>{null}</Link>
                </DirectoryCard>
              );
            })}
          </div>
        )}
      </section>
    </SuiteAccentScope>
  );
}
