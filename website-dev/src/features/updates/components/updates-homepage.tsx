import { useMemo } from "react";
import { SuiteAccentScope, SectionSeparator } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import {
  getUpdatesSuiteConfig,
  UPDATES_HOMEPAGE_ICON,
  UPDATES_HOMEPAGE_TITLE,
  type UpdatesSuiteId,
} from "@/config/updates";
import { getUpdatesEntries } from "@/features/updates/lib/content";
import { resolveHeadingActions } from "@/config/shared/heading-actions";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";
import { UpdateEntryCard } from "./update-entry-card";
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
              const isLatest = latestEntry?.id === entry.id;
              return <UpdateEntryCard key={entry.id} entry={entry} isLatest={isLatest} />;
            })}
          </div>
        )}
      </section>
    </SuiteAccentScope>
  );
}
