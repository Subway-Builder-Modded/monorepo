import { useCallback, useMemo, useState } from "react";
import { PageHeading, SectionSeparator, SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { Copy, FileQuestion, GitCompareArrows, Pencil, type LucideIcon } from "lucide-react";
import { getSuiteById } from "@/config/site-navigation";
import {
  getUpdatesSuiteConfig,
  UPDATES_HOMEPAGE_ICON,
  type UpdatesSuiteId,
} from "@/config/updates";
import { resolveHeadingActions } from "@/config/shared/heading-actions";
import { UTILITY_ACTION_CLASS } from "@/features/content/components/utility-action";
import {
  findUpdateEntry,
  getUpdateDirectoryEntries,
  getUpdateEditUrl,
  getUpdateRawContent,
  getUpdateSourcePath,
  getUpdatesEntries,
  loadUpdateContent,
} from "@/features/updates/lib/content";
import { articleMdxComponents } from "@/features/content/mdx";
import { AsyncArticleContent } from "@/features/content/components/async-article-content";
import { PageHeadingActions } from "@/features/content/components/page-heading-actions";
import { resolveLucideIcon } from "@/features/content/lib/icon-resolver";
import { mdxToMarkdown } from "@/features/docs/lib/markdown-copy";
import { Directory } from "@/features/updates/mdx/directory";
import { UpdatesRouteProvider } from "@/features/updates/mdx/updates-route-context";
import { formatUpdateDisplayId } from "@/features/updates/lib/formatting";
import { getUpdateArticleIdentity } from "@/features/updates/lib/identity";
import { UpdatesBreadcrumbs } from "./updates-breadcrumbs";
import { LatestReleaseChip, TagChip } from "./tag-badges";

export function UpdatePageLayout({ suiteId, id }: { suiteId: UpdatesSuiteId; id: string }) {
  const [copied, setCopied] = useState(false);
  const suite = getSuiteById(suiteId);
  const entry = findUpdateEntry(suiteId, id);
  const sourcePath = entry?.sourcePath ?? getUpdateSourcePath(suiteId, id);
  const rawContent = getUpdateRawContent(sourcePath);
  const entries = getUpdatesEntries(suiteId);
  const latestEntry = entries[0] ?? null;
  const releaseCandidates = useMemo(() => getUpdateDirectoryEntries(suiteId, id), [suiteId, id]);

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

  const Icon = resolveLucideIcon(entry.frontmatter.icon);
  const isParentVersion = !entry.id.includes("/");
  const suiteConfig = getUpdatesSuiteConfig(suiteId);
  const resolvedActions = resolveHeadingActions(suiteConfig?.changelog.pageActions, {
    suiteId,
    id: entry.id,
    isParentVersion,
    entry: { id: entry.id, frontmatter: entry.frontmatter },
  });
  const articleIdentity = getUpdateArticleIdentity(entry);
  const compareHref = entry.frontmatter.compareUrl?.trim() || null;
  const compareLabel = entry.frontmatter.previousVersion
    ? `${entry.frontmatter.previousVersion}...${entry.id}`
    : null;
  const editUrl = getUpdateEditUrl(suiteId, entry.id);

  const copyMarkdown = useCallback(async () => {
    if (!rawContent) return;
    try {
      const markdown = mdxToMarkdown(rawContent);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }, [rawContent]);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-6 lg:py-8">
        <UpdatesBreadcrumbs suiteId={suiteId} slug={entry.id} title={entry.frontmatter.title} />

        <PageHeading
          icon={Icon as LucideIcon}
          title={articleIdentity.title}
          description={`${formatUpdateDisplayId(entry.id)} • ${entry.frontmatter.date}`}
          badge={
            <div className="flex items-center gap-1.5">
              <TagChip tag={entry.frontmatter.tag} size="title" />
              {latestEntry?.id === entry.id ? <LatestReleaseChip size="title" /> : null}
            </div>
          }
          actions={<PageHeadingActions actions={resolvedActions} />}
          footer={
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <a
                  href={editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={UTILITY_ACTION_CLASS}
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  Edit
                </a>

                {rawContent ? (
                  <button type="button" onClick={copyMarkdown} className={UTILITY_ACTION_CLASS}>
                    <Copy className="size-3" aria-hidden="true" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                ) : null}
              </div>

              {compareHref && compareLabel ? (
                <a
                  href={compareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center gap-2 rounded-lg border border-border/70 bg-muted/35 px-3 py-2 font-mono text-xs text-foreground/85 no-underline transition-colors hover:bg-muted/55"
                  aria-label={`Full Changelog ${compareLabel}`}
                >
                  <GitCompareArrows
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">Full Changelog:</span>
                  <code className="rounded bg-background/80 px-1.5 py-0.5 text-[11px] text-foreground">
                    {compareLabel}
                  </code>
                </a>
              ) : null}
            </div>
          }
        />

        <SectionSeparator label="Changelog" icon={UPDATES_HOMEPAGE_ICON} className="mb-3" />
        <article className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-6">
          <div className="prose-docs max-w-none">
            <UpdatesRouteProvider value={{ suiteId, slug: entry.id }}>
              <AsyncArticleContent
                sourcePath={sourcePath}
                loadContent={loadUpdateContent}
                components={articleMdxComponents}
                loadingLines={2}
              />
            </UpdatesRouteProvider>
          </div>
        </article>

        {releaseCandidates.length > 0 ? (
          <section className="mt-4">
            <SectionSeparator label="Release Candidates" icon={GitCompareArrows} className="mb-3" />
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-6">
              <Directory path={entry.id} suiteId={suiteId} />
            </div>
          </section>
        ) : null}
      </section>
    </SuiteAccentScope>
  );
}
