import { useMemo } from "react";
import {
  NavRow,
  PageHeading,
  SITE_SHELL_CLASS,
  SuiteAccentButton,
  SuiteAccentScope,
  SuiteBadge,
} from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { getSuiteById } from "@/app/config/site-navigation";
import { getDocsSuiteConfig, getDocsVersion, isVersionedDocsSuite } from "@/app/config/docs";
import type { DocsSuiteId } from "@/app/config/docs";
import { getDocsTree, getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocPageUrl } from "@/app/features/docs/lib/routing";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { ExternalLink } from "lucide-react";
import { DocsVersionChooser } from "./docs-version-chooser";
import { DocsDeprecatedNotice } from "./docs-deprecated-notice";

function Signboard({ suiteId }: { suiteId: DocsSuiteId }) {
  const suite = getSuiteById(suiteId);
  const config = getDocsSuiteConfig(suiteId)!;
  const SuiteIcon = suite.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/30 p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-16 top-10 h-px w-64 rotate-[14deg] bg-[color-mix(in_srgb,var(--suite-accent-light)_45%,transparent)]" />
        <div className="absolute left-24 top-20 h-px w-80 -rotate-[9deg] bg-[color-mix(in_srgb,var(--suite-accent-light)_32%,transparent)]" />
        <div className="absolute right-[-6rem] bottom-8 h-28 w-28 rounded-full border border-[color-mix(in_srgb,var(--suite-accent-light)_35%,transparent)]" />
      </div>

      <PageHeading
        className="mb-0"
        icon={SuiteIcon as any}
        title={config.homepage.heroTitle ?? `${suite.title} Docs`}
        description={config.homepage.description}
        accent={suite.accent}
      />
    </div>
  );
}

function HomepageControlStrip({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
}) {
  const suite = getSuiteById(suiteId);
  const config = getDocsSuiteConfig(suiteId)!;
  const actions = config.homepage.actions?.slice(0, 2) ?? [];

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/75 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <SuiteBadge accent={suite.accent} className="normal-case tracking-normal">
          {suite.title}
        </SuiteBadge>

        {isVersionedDocsSuite(suiteId) && version ? (
          <DocsVersionChooser suiteId={suiteId} currentVersion={version} />
        ) : null}
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            const isExternal = action.external === true;
            return (
              <SuiteAccentButton
                key={action.label}
                asChild
                tone={action.variant === "solid" ? "solid" : "outline"}
                className="h-8 gap-1.5 rounded-md px-2.5 text-xs"
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-3">
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
        <div className={SITE_SHELL_CLASS}>
          {isDeprecated && version ? (
            <DocsDeprecatedNotice suiteId={suiteId} version={version} context="homepage" />
          ) : null}
          <Signboard suiteId={suiteId} />
          <HomepageControlStrip suiteId={suiteId} version={version} />
        </div>

        <div className={cn(SITE_SHELL_CLASS, "mt-2")}>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Start Here
          </h2>
          <DocsCardGrid suiteId={suiteId} version={version} />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
