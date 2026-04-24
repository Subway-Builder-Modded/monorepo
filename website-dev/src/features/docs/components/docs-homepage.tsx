import { useMemo } from "react";
import { SuiteAccentScope, NavRow } from "@subway-builder-modded/shared-ui";
import { Compass } from "lucide-react";
import { getDocsSuiteConfig, getDocsVersion, hasMultipleVisibleVersions } from "@/config/docs";
import { DOCS_HOMEPAGE_ICON, DOCS_HOMEPAGE_TITLE } from "@/config/docs/shared";
import type { DocsSuiteId } from "@/config/docs";
import { getSuiteById, getSuiteDocsNavItem } from "@/config/site-navigation";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import { DocsDeprecatedNotice } from "@/features/docs/components/docs-deprecated-notice";
import { DocsVersionChooser } from "@/features/docs/components/docs-version-chooser";
import { getDocsTree, getVisibleNodes } from "@/features/docs/lib/content";
import { resolveIcon } from "@/features/docs/lib/icon-resolver";
import { getDocPageUrl } from "@/features/docs/lib/routing";
import { resolveHeadingActions } from "@/config/shared/heading-actions";
import { FeatureHomepageHeading } from "@/features/content/components/feature-homepage-heading";

function HomepageHero({ suiteId, version }: { suiteId: DocsSuiteId; version: string | null }) {
  const config = getDocsSuiteConfig(suiteId)!;
  const actions = resolveHeadingActions(config.homepage.actions, { suiteId, version });
  const description = getSuiteDocsNavItem(suiteId)?.description;
  const hasVersionChooser = hasMultipleVisibleVersions(suiteId) && version;

  return (
    <FeatureHomepageHeading
      icon={DOCS_HOMEPAGE_ICON}
      iconTestId="docs-homepage-hero-icon"
      title={DOCS_HOMEPAGE_TITLE}
      description={description}
      suiteId={suiteId}
      actions={actions}
      footer={
        hasVersionChooser ? (
          <div className="flex justify-center">
            <DocsVersionChooser
              suiteId={suiteId}
              currentVersion={version}
              homepageMode
              triggerClassName="h-9 min-w-[14rem] text-[13px]"
            />
          </div>
        ) : null
      }
    />
  );
}

function DocsCardGrid({ suiteId, version }: { suiteId: DocsSuiteId; version: string | null }) {
  const tree = getDocsTree(suiteId, version);
  const visibleNodes = useMemo(() => getVisibleNodes(tree.nodes), [tree]);

  if (visibleNodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No documentation pages found for this version.
      </p>
    );
  }

  return (
    <>
      <div
        className="mb-4 flex items-center gap-2.5"
        aria-label="Directory section"
        data-testid="directory-separator"
      >
        <Compass className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Directory
        </span>
        <div className="h-px flex-1 bg-border/60" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleNodes.map((node) => {
          const Icon = resolveIcon(node.frontmatter.icon);

          return (
            <Link
              key={node.slug}
              to={getDocPageUrl(suiteId, version, node.slug)}
              className={cn(
                "group block rounded-xl border-2 border-border/60 bg-background/70 p-2 transition-all",
                "hover:border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_7%,transparent)]",
                "dark:hover:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_10%,transparent)]",
              )}
              style={{
                ["--nav-accent" as string]: "var(--suite-accent-light)",
                ["--nav-muted" as string]:
                  "color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)",
              }}
            >
              <NavRow
                title={node.frontmatter.title}
                description={node.frontmatter.description}
                icon={<Icon className="size-5" aria-hidden={true} />}
                className="rounded-[0.7rem]"
              />
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function DocsHomepage({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
}) {
  const versionConfig = version ? getDocsVersion(suiteId, version) : null;
  const isDeprecated = versionConfig?.status === "deprecated";
  const suite = getSuiteById(suiteId);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-6 lg:py-8">
        {isDeprecated && version ? (
          <DocsDeprecatedNotice suiteId={suiteId} version={version} context="homepage" />
        ) : null}
        <HomepageHero suiteId={suiteId} version={version} />

        <div>
          <DocsCardGrid suiteId={suiteId} version={version} />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
