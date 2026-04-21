import { useMemo } from "react";
import { NavRow, SuiteAccentScope, SuiteBadge } from "@subway-builder-modded/shared-ui";
import { Compass, ExternalLink } from "lucide-react";
import { getDocsSuiteConfig, getDocsVersion, isVersionedDocsSuite } from "@/app/config/docs";
import type { DocsSuiteId } from "@/app/config/docs";
import { getSuiteById } from "@/app/config/site-navigation";
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
  const hasVersionChooser = isVersionedDocsSuite(suiteId) && version;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-background via-background to-muted/25 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)]",
        DOCS_SURFACE_BORDER_CLASS,
      )}
    >
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_70%,transparent)] to-transparent" />

      <div className="relative flex items-start gap-4 p-5 sm:p-7">
        <span className="mt-0.5 inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_12%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:text-[var(--suite-accent-dark)]">
          <SuiteIcon className="size-6" aria-hidden={true} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 pb-1.5">
            <h1 className="text-2xl font-black tracking-[-0.02em] text-foreground sm:text-3xl">
              {config.homepage.heroTitle ?? `${suite.title} Docs`}
            </h1>
            <SuiteBadge className={SHARED_SUITE_BADGE_CLASS} accent={suite.accent}>
              <SuiteIcon className="size-3.5" aria-hidden={true} />
              <span className="max-w-[8rem] truncate">{suite.title}</span>
            </SuiteBadge>
          </div>
          {config.homepage.description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {config.homepage.description}
            </p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="shrink-0">
            <div className="flex min-w-[8.75rem] flex-col items-stretch gap-1">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              const isExternal = action.external === true;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                    className={cn(ACTION_CLASS, "justify-start")}
                >
                  {ActionIcon ? <ActionIcon className="size-3" aria-hidden="true" /> : null}
                  {action.label}
                  {isExternal ? <ExternalLink className="size-3" aria-hidden="true" /> : null}
                </a>
              );
            })}
            </div>
          </div>
        ) : null}
      </div>

      {hasVersionChooser ? (
        <div className="border-t border-[color-mix(in_srgb,var(--suite-accent-light)_18%,var(--border))] px-5 py-4 sm:px-7">
          <div className="flex justify-center">
            <DocsVersionChooser
              suiteId={suiteId}
              currentVersion={version}
              homepageMode
              triggerClassName="h-10 min-w-[14rem] text-[13px]"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RouteDivider() {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_45%,transparent)] to-[color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)]" />
      <span className="inline-flex items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_7%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <Compass className="size-3" aria-hidden="true" />
        Discover
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_45%,transparent)] to-[color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)]" />
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(14.5rem,1fr))] gap-3">
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

        <div className="mt-4">
          <RouteDivider />
          <DocsCardGrid suiteId={suiteId} version={version} />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
