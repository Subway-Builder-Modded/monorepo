import { useMemo } from "react";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { getSuiteById } from "@/app/config/site-navigation";
import { getDocsSuiteConfig, getVisibleVersions, getDocsVersion } from "@/app/features/docs/config";
import type { DocsSuiteId } from "@/app/features/docs/config";
import { getDocsTree, getVisibleNodes } from "@/app/features/docs/lib/content";
import { getDocPageUrl, getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { BookText, ArrowRight, AlertTriangle } from "lucide-react";

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

function VersionCards({
  suiteId,
  currentVersion,
}: {
  suiteId: DocsSuiteId;
  currentVersion: string;
}) {
  const versions = getVisibleVersions(suiteId);
  if (versions.length <= 1) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Versions
      </h2>
      <div className="flex flex-wrap gap-2">
        {versions.map((v) => {
          const isActive = v.value === currentVersion;
          const vConfig = getDocsVersion(suiteId, v.value);
          const isDeprecated = vConfig?.status === "deprecated";

          return (
            <Link
              key={v.value}
              to={getDocsHomepageUrl(suiteId, v.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-[var(--suite-accent-light)]/15 dark:bg-[var(--suite-accent-dark)]/15 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] ring-1 ring-[var(--suite-accent-light)]/30 dark:ring-[var(--suite-accent-dark)]/30"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                isDeprecated && !isActive && "opacity-60",
              )}
            >
              {v.label}
              {isDeprecated && (
                <span className="text-[10px] uppercase tracking-wide opacity-70">deprecated</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DocsCardGrid({
  suiteId,
  version,
}: {
  suiteId: DocsSuiteId;
  version: string;
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
  version: string;
}) {
  const suite = getSuiteById(suiteId);
  const config = getDocsSuiteConfig(suiteId)!;
  const versionConfig = getDocsVersion(suiteId, version);
  const isDeprecated = versionConfig?.status === "deprecated";

  return (
    <div className="mx-auto max-w-3xl py-6">
      {isDeprecated && <DeprecatedBanner version={version} />}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--suite-accent-light)]/10 dark:bg-[var(--suite-accent-dark)]/10">
            <BookText className="size-5 text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {config.homepage.heroTitle ?? `${suite.title} Documentation`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {versionConfig?.label ?? version}
            </p>
          </div>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {config.homepage.description}
        </p>
      </div>

      <VersionCards suiteId={suiteId} currentVersion={version} />

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Getting Started
        </h2>
        <DocsCardGrid suiteId={suiteId} version={version} />
      </div>
    </div>
  );
}
