import { useMemo } from "react";
import { NavRow, SuiteAccentScope, SuiteBadge } from "@subway-builder-modded/shared-ui";
import { ExternalLink, Compass } from "lucide-react";
import { getDocsSuiteConfig, getDocsVersion, hasMultipleVisibleVersions } from "@/app/config/docs";
import { DOCS_HOMEPAGE_ICON, DOCS_HOMEPAGE_TITLE } from "@/app/config/docs/shared";
import type { DocsSuiteId } from "@/app/config/docs";
import { getSuiteById, getSuiteDocsNavItem } from "@/app/config/site-navigation";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { DocsDeprecatedNotice } from "@/app/features/docs/components/docs-deprecated-notice";
import { DocsVersionChooser } from "@/app/features/docs/components/docs-version-chooser";
import { getDocsTree, getVisibleNodes } from "@/app/features/docs/lib/content";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { getDocPageUrl } from "@/app/features/docs/lib/routing";

const SHARED_SUITE_BADGE_CLASS =
  "h-7 shrink-0 self-center gap-1.5 rounded-md px-2 normal-case tracking-normal";

const ACTION_CLASS =
  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-muted-foreground no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_14%,transparent)] dark:hover:text-[var(--suite-accent-dark)]";

const DOCS_SURFACE_BORDER_CLASS =
  "border-2 border-[color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))]";

function HomepageHero({ suiteId, version }: { suiteId: DocsSuiteId; version: string | null }) {
  const suite = getSuiteById(suiteId);
  const config = getDocsSuiteConfig(suiteId)!;
  const actions = config.homepage.actions ?? [];
  const SuiteIcon = suite.icon;
  const HeroIcon = DOCS_HOMEPAGE_ICON;
  const description = getSuiteDocsNavItem(suiteId)?.description;
  const hasVersionChooser = hasMultipleVisibleVersions(suiteId) && version;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-background/85",
        DOCS_SURFACE_BORDER_CLASS,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_55%,transparent)] to-transparent"
      />

      <div className="relative flex items-start gap-4 px-5 py-5 sm:px-7 sm:py-6">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--suite-accent-light)_28%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_10%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_34%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_16%,transparent)] dark:text-[var(--suite-accent-dark)]">
          <HeroIcon className="size-5" aria-hidden={true} data-testid="docs-homepage-hero-icon" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <h1 className="text-2xl font-bold tracking-[-0.015em] text-foreground sm:text-[1.6rem]">
              {DOCS_HOMEPAGE_TITLE}
            </h1>
            <SuiteBadge className={SHARED_SUITE_BADGE_CLASS} accent={suite.accent}>
              <SuiteIcon className="size-3.5" aria-hidden={true} />
              <span className="max-w-[8rem] truncate">{suite.title}</span>
            </SuiteBadge>
          </div>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="hidden shrink-0 sm:block">
            <div className="flex flex-col items-end gap-1">
              {actions.map((action) => {
                const ActionIcon = action.icon;
                const isExternal = action.external === true;
                return (
                  <a
                    key={action.label}
                    href={action.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className={ACTION_CLASS}
                  >
                    {ActionIcon ? <ActionIcon className="size-3" aria-hidden="true" /> : null}
                    <span>{action.label}</span>
                    {isExternal ? <ExternalLink className="size-3" aria-hidden="true" /> : null}
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {hasVersionChooser ? (
        <div className="border-t border-[color-mix(in_srgb,var(--suite-accent-light)_18%,var(--border))] px-5 py-3 sm:px-7">
          <div className="flex justify-center">
            <DocsVersionChooser
              suiteId={suiteId}
              currentVersion={version}
              homepageMode
              triggerClassName="h-9 min-w-[14rem] text-[13px]"
            />
          </div>
        </div>
      ) : null}
    </div>
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
        aria-label="Discover section"
        data-testid="discover-separator"
      >
        <Compass
          className="size-3.5 shrink-0 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]"
          aria-hidden="true"
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          DISCOVER
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

        <div className="mt-5">
          <DocsCardGrid suiteId={suiteId} version={version} />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
