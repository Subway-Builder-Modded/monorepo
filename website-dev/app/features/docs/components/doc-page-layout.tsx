import { useState, useEffect, useMemo, Suspense } from "react";
import {
  SITE_SHELL_CLASS,
  SuiteAccentInlineAction,
  SuiteAccentLink,
  SuiteAccentScope,
} from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { cn } from "@/app/lib/utils";
import { getSuiteById } from "@/app/config/site-navigation";
import { getDocsVersion, isVersionedDocsSuite } from "@/app/config/docs";
import type { DocsSuiteId } from "@/app/config/docs";
import {
  getDocsTree,
  findTreeNode,
  loadDocContent,
  getDocRawContent,
  getDocSourcePath,
  getEditUrl,
} from "@/app/features/docs/lib/content";
import { extractHeadings } from "@/app/features/docs/lib/headings";
import { mdxToMarkdown } from "@/app/features/docs/lib/markdown-copy";
import { getDocsHomepageUrl, getDocPageUrl } from "@/app/features/docs/lib/routing";
import { mdxComponents } from "@/app/features/docs/mdx/components";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { DocsSidebar, MobileDocsSidebar } from "./sidebar";
import { OnThisPage } from "./on-this-page";
import {
  Pencil,
  Copy,
  Check,
  AlertTriangle,
  ChevronRight,
  FileQuestion,
} from "lucide-react";

function DeprecatedBanner({ version }: { version: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-medium text-amber-600 dark:text-amber-400">
          This page is from <strong>{version}</strong>, which is deprecated.
        </p>
      </div>
    </div>
  );
}

function Breadcrumbs({
  suiteId,
  version,
  slug,
  title,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
  slug: string;
  title: string;
}) {
  const suite = getSuiteById(suiteId);
  const parts = slug.split("/");
  const showVersion = isVersionedDocsSuite(suiteId) && !!version;
  const breadcrumbVersion = version?.startsWith("v") ? version : version ? `v${version}` : null;
  const firstCrumb = showVersion
    ? `${suite.title} Documentation (${breadcrumbVersion})`
    : `${suite.title} Documentation`;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <SuiteAccentLink asChild>
            <Link to={getDocsHomepageUrl(suiteId, version)}>{firstCrumb}</Link>
          </SuiteAccentLink>
        </li>
        {parts.length > 1 &&
          parts.slice(0, -1).map((part, i) => {
            const parentSlug = parts.slice(0, i + 1).join("/");
            return (
              <li key={i} className="flex items-center gap-1">
                <ChevronRight className="size-3" aria-hidden="true" />
                <SuiteAccentLink asChild>
                  <Link to={getDocPageUrl(suiteId, version, parentSlug)} className="capitalize">
                    {part.replace(/-/g, " ")}
                  </Link>
                </SuiteAccentLink>
              </li>
            );
          })}
        <li className="flex items-center gap-1">
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const markdown = mdxToMarkdown(content);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <SuiteAccentInlineAction onClick={handleCopy} aria-label="Copy page as Markdown">
      {copied ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Copy className="size-3" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </SuiteAccentInlineAction>
  );
}

function DocContent({
  sourcePath,
}: {
  sourcePath: string;
}) {
  const [Content, setContent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setError(null);

    loadDocContent(sourcePath)
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
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted/40" />
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
      <Content components={mdxComponents} />
    </Suspense>
  );
}

export function DocPageLayout({
  suiteId,
  version,
  slug,
}: {
  suiteId: DocsSuiteId;
  version: string | null;
  slug: string;
}) {
  const tree = getDocsTree(suiteId, version);
  const node = findTreeNode(tree, slug);
  const versionConfig = version ? getDocsVersion(suiteId, version) : null;
  const isDeprecated = versionConfig?.status === "deprecated";

  const sourcePath = node?.sourcePath ?? getDocSourcePath(suiteId, version, slug);
  const rawContent = getDocRawContent(sourcePath);
  const headings = useMemo(
    () => (rawContent ? extractHeadings(rawContent) : []),
    [rawContent],
  );
  const editUrl = getEditUrl(suiteId, version, slug);
  const suite = getSuiteById(suiteId);
  const Icon = node ? resolveIcon(node.frontmatter.icon) : null;

  if (!node) {
    return (
      <SuiteAccentScope accent={suite.accent}>
        <div className={cn(SITE_SHELL_CLASS, "py-6 lg:py-8")}> 
          <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_15rem]">
            <DocsSidebar
              tree={tree}
              suiteId={suiteId}
              currentVersion={version}
              currentSlug={null}
            />

            <div className="min-w-0 rounded-2xl border-2 border-border/60 bg-background/75 p-8 text-center">
              <div className="flex flex-col items-center gap-4 py-12">
                <FileQuestion className="size-12 text-muted-foreground" aria-hidden={true} />
                <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
                <p className="text-sm text-muted-foreground">
                  The documentation page &quot;{slug}&quot; was not found{version ? ` in ${version}` : ""}.
                </p>
                <SuiteAccentLink asChild>
                  <Link to={getDocsHomepageUrl(suiteId, version)}>Return to docs home</Link>
                </SuiteAccentLink>
              </div>
            </div>
          </div>
        </div>
      </SuiteAccentScope>
    );
  }

  return (
    <SuiteAccentScope accent={suite.accent}>
      <div className={cn(SITE_SHELL_CLASS, "py-6 lg:py-8")}> 
        <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)_15rem]">
          <DocsSidebar
            tree={tree}
            suiteId={suiteId}
            currentVersion={version}
            currentSlug={slug}
          />

          <article className="min-w-0">
            <MobileDocsSidebar
              tree={tree}
              suiteId={suiteId}
              currentVersion={version}
              currentSlug={slug}
            />

            {isDeprecated && version ? <DeprecatedBanner version={version} /> : null}

            <Breadcrumbs
              suiteId={suiteId}
              version={version}
              slug={slug}
              title={node.frontmatter.title}
            />

            <header className="mb-4 rounded-2xl border-2 border-border/65 bg-background/72 p-4 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.35)] sm:p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--suite-accent-light)_30%,transparent)] bg-[color-mix(in_srgb,var(--suite-accent-light)_13%,transparent)] text-[var(--suite-accent-light)] dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_36%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:text-[var(--suite-accent-dark)]">
                  {Icon ? <Icon className="size-5" aria-hidden={true} /> : null}
                </span>

                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-black tracking-[-0.02em] text-foreground sm:text-3xl">
                    {node.frontmatter.title}
                  </h1>
                  {node.frontmatter.description ? (
                    <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                      {node.frontmatter.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SuiteAccentLink
                  href={editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 gap-1.5 rounded-md border border-[color-mix(in_srgb,var(--suite-accent-light)_28%,transparent)] px-2 no-underline decoration-transparent hover:no-underline dark:border-[color-mix(in_srgb,var(--suite-accent-dark)_35%,transparent)]"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  Edit on GitHub
                </SuiteAccentLink>
                {rawContent ? <CopyButton content={rawContent} /> : null}
              </div>
            </header>

            <section className="rounded-2xl border border-border/60 bg-background/50 px-4 py-5 sm:px-6 sm:py-6">
              <div className="prose-docs max-w-none">
                <DocContent sourcePath={sourcePath} />
              </div>
            </section>
          </article>

          <OnThisPage headings={headings} editUrl={editUrl} rawContent={rawContent} />
        </div>
      </div>
    </SuiteAccentScope>
  );
}
