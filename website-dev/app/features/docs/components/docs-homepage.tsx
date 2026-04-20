import { useMemo } from "react";
import { SuiteBadge, SuiteStatusChip } from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { getSuiteById } from "@/app/config/site-navigation";
import {
  getDocsSuiteConfig,
  getDocsVersion,
  getVisibleVersions,
  isVersionedDocsSuite,
} from "@/app/config/docs";
import type { DocsSuiteId } from "@/app/config/docs";
import { getDocsTree, getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocPageUrl, getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { ArrowRight, AlertTriangle } from "lucide-react";

function DeprecatedBanner({ version }: { version: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium text-amber-600 dark:text-amber-400">
          You are viewing docs for <strong>{version}</strong>, which is deprecated.
        </p>
        <p className="mt-1 text-muted-foreground">
          Consider switching to the latest version for up-to-date information.
        </p>
      </div>
    </div>
  );
}

function Signboard({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
}) {
  const suite = getSuiteById(suiteId);
  const config = getDocsSuiteConfig(suiteId)!;
  const isVersioned = isVersionedDocsSuite(suiteId);
  const versionConfig = version ? getDocsVersion(suiteId, version) : null;
  const versions = getVisibleVersions(suiteId);
  const SuiteIcon = suite.icon;

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-[var(--suite-accent-light)]/6 via-transparent to-[var(--suite-accent-light)]/3 dark:from-[var(--suite-accent-dark)]/8 dark:to-[var(--suite-accent-dark)]/4 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--suite-accent-light)]/12 dark:bg-[var(--suite-accent-dark)]/12 ring-1 ring-[var(--suite-accent-light)]/20 dark:ring-[var(--suite-accent-dark)]/20">
          <SuiteIcon className="size-6 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]" aria-hidden={true} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {config.homepage.heroTitle ?? `${suite.title} Documentation`}
          </h1>
          <p className="mt-1 text-sm text-foreground/70 leading-relaxed max-w-lg">
            {config.homepage.description}
          </p>
          {isVersioned && versions.length > 1 && version && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {versions.map((v) => {
                const isActive = v.value === version;
                const isDeprecated = getDocsVersion(suiteId, v.value)?.status === "deprecated";

                return (
                  <Link
                    key={v.value}
                    to={getDocsHomepageUrl(suiteId, v.value)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-[var(--suite-accent-light)]/15 dark:bg-[var(--suite-accent-dark)]/15 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] ring-1 ring-[var(--suite-accent-light)]/30 dark:ring-[var(--suite-accent-dark)]/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      isDeprecated && !isActive && "opacity-60",
                    )}
                  >
                    {v.label}
                    {isDeprecated ? (
                      <SuiteStatusChip
                        status="deprecated"
                        deprecatedTone="gray"
                        size="sm"
                        className="opacity-80"
                      />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
          {isVersioned && versions.length <= 1 && versionConfig && (
            <SuiteBadge className="mt-2 normal-case tracking-normal">
              {versionConfig.label}
            </SuiteBadge>
          )}
        </div>
      </div>
    </div>
  );
}

function DocsCardGrid({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
}) {
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
    <div className="grid gap-3 sm:grid-cols-2">
      {visibleNodes.map((node) => {
        const Icon = resolveIcon(node.frontmatter.icon);

        return (
          <Link
            key={node.slug}
            to={getDocPageUrl(suiteId, version, node.slug)}
            className={cn(
              "group flex flex-col gap-2 rounded-xl border border-border/40 p-4",
              "bg-card/30 transition-all hover:border-border/60 hover:bg-card/50",
              "hover:shadow-sm",
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/40">
                <Icon className="size-4 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]" aria-hidden={true} />
              </div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-[var(--suite-accent-light)] dark:group-hover:text-[var(--suite-accent-dark)] transition-colors">
                {node.frontmatter.title}
              </h3>
            </div>
            {node.frontmatter.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {node.frontmatter.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-[var(--suite-accent-light)] dark:group-hover:text-[var(--suite-accent-dark)] transition-colors mt-auto">
              <span>Read more</span>
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
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

  return (
    <div className="mx-auto max-w-3xl py-6">
      {isDeprecated && version && <DeprecatedBanner version={version} />}

      <Signboard suiteId={suiteId} version={version} />

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Getting Started
        </h2>
        <DocsCardGrid suiteId={suiteId} version={version} />
      </div>
    </div>
  );
}
