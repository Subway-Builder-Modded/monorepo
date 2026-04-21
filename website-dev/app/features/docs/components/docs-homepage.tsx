import { useMemo } from "react";
import {
  NavRow,
  PageHeading,
  SuiteAccentButton,
  SuiteAccentScope,
  SuiteBadge,
} from "@subway-builder-modded/shared-ui";
import { ExternalLink } from "lucide-react";
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

function HomepageHero({ suiteId }: { suiteId: DocsSuiteId }) {
  const suite = getSuiteById(suiteId);
  const config = getDocsSuiteConfig(suiteId)!;
  const SuiteIcon = suite.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--suite-accent-light)_22%,var(--border))] bg-gradient-to-br from-background via-background to-muted/40 p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-12 top-14 h-px w-80 rotate-[13deg] bg-[color-mix(in_srgb,var(--suite-accent-light)_44%,transparent)]" />
        <div className="absolute left-16 top-28 h-px w-96 -rotate-[8deg] bg-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)]" />
        <div className="absolute right-8 top-8 h-20 w-20 rounded-xl border border-[color-mix(in_srgb,var(--suite-accent-light)_33%,transparent)]" />
        <div className="absolute -right-8 bottom-6 h-24 w-24 rounded-full border border-[color-mix(in_srgb,var(--suite-accent-light)_28%,transparent)]" />
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_85%,transparent)] to-transparent" />
      </div>

      <PageHeading
        className="mb-0"
        icon={SuiteIcon as any}
        title={config.homepage.heroTitle ?? `${suite.title} Docs`}
        description={config.homepage.description}
        badge={
          <SuiteBadge className={SHARED_SUITE_BADGE_CLASS} accent={suite.accent}>
            <SuiteIcon className="size-3.5" aria-hidden={true} />
            <span className="max-w-[8rem] truncate">{suite.title}</span>
          </SuiteBadge>
        }
        accent={suite.accent}
      />
    </div>
  );
}

function HomepageControls({ suiteId, version }: { suiteId: DocsSuiteId; version: string | null }) {
  const config = getDocsSuiteConfig(suiteId)!;
  const actions = config.homepage.actions?.slice(0, 2) ?? [];
  const hasVersionChooser = isVersionedDocsSuite(suiteId) && version;

  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background/80 px-4 py-4 shadow-[0_12px_28px_-22px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:px-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_45%,transparent)] to-transparent" />
      </div>

      {hasVersionChooser ? (
        <div className="flex justify-center pb-3">
          <DocsVersionChooser
            suiteId={suiteId}
            currentVersion={version}
            triggerClassName="h-10 min-w-[13rem] text-[13px]"
          />
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            const isExternal = action.external === true;
            return (
              <SuiteAccentButton
                key={action.label}
                asChild
                tone={action.variant === "solid" ? "solid" : "outline"}
                className="h-9 gap-1.5 rounded-md px-3 text-xs sm:text-sm"
              >
                <a
                  href={action.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                >
                  {ActionIcon ? <ActionIcon className="size-3.5" aria-hidden="true" /> : null}
                  {action.label}
                  {isExternal ? <ExternalLink className="size-3" aria-hidden="true" /> : null}
                </a>
              </SuiteAccentButton>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function RouteDivider() {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--suite-accent-light)_45%,transparent)] to-[color-mix(in_srgb,var(--suite-accent-light)_20%,transparent)]" />
      <span className="rounded-md border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_7%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Route Board
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
        <HomepageHero suiteId={suiteId} />
        <HomepageControls suiteId={suiteId} version={version} />

        <div className="mt-2">
          <RouteDivider />
          <DocsCardGrid suiteId={suiteId} version={version} />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
