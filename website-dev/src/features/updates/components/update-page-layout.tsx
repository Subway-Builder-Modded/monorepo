import { useEffect, useState, Suspense } from "react";
import { PageHeading, SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { FileQuestion, GitCompareArrows } from "lucide-react";
import { getSuiteById } from "@/config/site-navigation";
import { getUpdatesSuiteConfig, type UpdatesSuiteId } from "@/config/updates";
import { resolveHeadingActions } from "@/config/shared/heading-actions";
import {
  findUpdateEntry,
  getUpdateDirectoryEntries,
  getUpdateSourcePath,
  getUpdatesEntries,
  loadUpdateContent,
} from "@/features/updates/lib/content";
import { articleMdxComponents } from "@/features/content/mdx";
import { PageHeadingActions } from "@/features/content/components/page-heading-actions";
import { resolveIcon } from "@/features/docs/lib/icon-resolver";
import { Directory } from "@/features/updates/mdx/directory";
import { UpdatesRouteProvider } from "@/features/updates/mdx/updates-route-context";
import { formatUpdateDisplayId } from "@/features/updates/lib/formatting";
import { UpdatesBreadcrumbs } from "./updates-breadcrumbs";
import { LatestReleaseChip, TagChip } from "./tag-badges";

function UpdateContent({ sourcePath }: { sourcePath: string }) {
  const [Content, setContent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setError(null);

    loadUpdateContent(sourcePath)
      .then((component) => {
        if (!cancelled) {
          if (component) {
            setContent(() => component);
          } else {
            setError("Content not found");
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load content");
      });

    return () => {
      cancelled = true;
    };
  }, [sourcePath]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <FileQuestion className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!Content) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted/40" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted/40" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-4 py-8">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted/40" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted/40" />
        </div>
      }
    >
      <Content components={articleMdxComponents} />
    </Suspense>
  );
}

export function UpdatePageLayout({ suiteId, id }: { suiteId: UpdatesSuiteId; id: string }) {
  const suite = getSuiteById(suiteId);
  const entry = findUpdateEntry(suiteId, id);
  const sourcePath = entry?.sourcePath ?? getUpdateSourcePath(suiteId, id);
  const entries = getUpdatesEntries(suiteId);
  const latestEntry = entries[0] ?? null;
  const releaseCandidates = getUpdateDirectoryEntries(suiteId, id);

  if (!entry) {
    return (
      <SuiteAccentScope accent={suite.accent}>
        <div className="py-10 text-center">
          <FileQuestion className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden={true} />
          <h1 className="text-lg font-bold">Update Not Found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The update version "{id}" was not found for {suite.title}.
          </p>
        </div>
      </SuiteAccentScope>
    );
  }

  const Icon = resolveIcon(entry.frontmatter.icon);
  const isParentVersion = !entry.id.includes("/");
  const suiteConfig = getUpdatesSuiteConfig(suiteId);
  const resolvedActions = resolveHeadingActions(suiteConfig?.changelog.pageActions, {
    suiteId,
    id: entry.id,
    isParentVersion,
    entry: { id: entry.id, frontmatter: entry.frontmatter },
  });
  const compareHref = entry.frontmatter.compareUrl?.trim() || null;
  const compareLabel = entry.frontmatter.previousVersion
    ? `${entry.frontmatter.previousVersion}...${entry.id}`
    : null;

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-6 lg:py-8">
        <UpdatesBreadcrumbs suiteId={suiteId} slug={entry.id} title={entry.frontmatter.title} />

        <PageHeading
          icon={Icon}
          title={entry.frontmatter.title}
          description={`${formatUpdateDisplayId(entry.id)} • ${entry.frontmatter.date}`}
          badge={
            <div className="flex items-center gap-1.5">
              <TagChip tag={entry.frontmatter.tag} size="title" />
              {latestEntry?.id === entry.id ? <LatestReleaseChip size="title" /> : null}
            </div>
          }
          actions={<PageHeadingActions actions={resolvedActions} />}
          footer={
            compareHref && compareLabel ? (
              <a
                href={compareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center gap-2 rounded-lg border border-border/70 bg-muted/35 px-3 py-2 font-mono text-xs text-foreground/85 no-underline transition-colors hover:bg-muted/55"
                aria-label={`Full Changelog ${compareLabel}`}
              >
                <GitCompareArrows className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">Full Changelog:</span>
                <code className="rounded bg-background/80 px-1.5 py-0.5 text-[11px] text-foreground">
                  {compareLabel}
                </code>
              </a>
            ) : null
          }
        />

        <article className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Changelog
          </h2>
          <div className="prose-docs max-w-none">
            <UpdatesRouteProvider value={{ suiteId, slug: entry.id }}>
              <UpdateContent sourcePath={sourcePath} />
            </UpdatesRouteProvider>
          </div>
        </article>

        {releaseCandidates.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Release Candidates
            </h2>
            <Directory path={entry.id} suiteId={suiteId} />
          </section>
        ) : null}
      </section>
    </SuiteAccentScope>
  );
}
