import { useState, useEffect, useMemo, Suspense } from "react";
import { Link } from "@/app/lib/router";
import { getSuiteById } from "@/app/config/site-navigation";
import { getDocsVersion } from "@/app/config/docs";
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
  version: string;
  slug: string;
  title: string;
}) {
  const suite = getSuiteById(suiteId);
  const parts = slug.split("/");

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <li>
          <Link
            to={getDocsHomepageUrl(suiteId, version)}
            className="hover:text-foreground transition-colors"
          >
            {suite.title}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3" />
        </li>
        <li>
          <span className="text-muted-foreground/70">{version}</span>
        </li>
        {parts.length > 1 &&
          parts.slice(0, -1).map((part, i) => {
            const parentSlug = parts.slice(0, i + 1).join("/");
            return (
              <li key={i} className="flex items-center gap-1">
                <ChevronRight className="size-3" aria-hidden="true" />
                <Link
                  to={getDocPageUrl(suiteId, version, parentSlug)}
                  className="capitalize hover:text-foreground transition-colors"
                >
                  {part.replace(/-/g, " ")}
                </Link>
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
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
      aria-label="Copy page as Markdown"
    >
      {copied ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Copy className="size-3" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
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
  version: string;
  slug: string;
}) {
  const tree = getDocsTree(suiteId, version);
  const node = findTreeNode(tree, slug);
  const versionConfig = getDocsVersion(suiteId, version);
  const isDeprecated = versionConfig?.status === "deprecated";

  const sourcePath = node?.sourcePath ?? getDocSourcePath(suiteId, version, slug);
  const rawContent = getDocRawContent(sourcePath);
  const headings = useMemo(
    () => (rawContent ? extractHeadings(rawContent) : []),
    [rawContent],
  );
  const editUrl = getEditUrl(suiteId, version, slug);

  if (!node) {
    return (
      <div className="mx-auto flex max-w-5xl gap-8 py-6">
        <DocsSidebar
          tree={tree}
          suiteId={suiteId}
          currentVersion={version}
          currentSlug={null}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <FileQuestion className="size-12 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
            <p className="text-sm text-muted-foreground">
              The documentation page &quot;{slug}&quot; was not found in {version}.
            </p>
            <Link
              to={getDocsHomepageUrl(suiteId, version)}
              className="text-sm text-[var(--suite-accent-light)] dark:text-[var(--suite-accent-dark)] hover:underline"
            >
              Return to docs home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] gap-8 py-6 px-4 lg:px-8">
      <DocsSidebar
        tree={tree}
        suiteId={suiteId}
        currentVersion={version}
        currentSlug={slug}
      />

      <article className="flex-1 min-w-0">
        <MobileDocsSidebar
          tree={tree}
          suiteId={suiteId}
          currentVersion={version}
          currentSlug={slug}
        />

        {isDeprecated && <DeprecatedBanner version={version} />}

        <Breadcrumbs
          suiteId={suiteId}
          version={version}
          slug={slug}
          title={node.frontmatter.title}
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {node.frontmatter.title}
          </h1>
          {node.frontmatter.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {node.frontmatter.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Pencil className="size-3" aria-hidden="true" />
              Edit on GitHub
            </a>
            {rawContent && <CopyButton content={rawContent} />}
          </div>
        </div>

        <div className="prose-docs max-w-none">
          <DocContent sourcePath={sourcePath} />
        </div>
      </article>

      <OnThisPage headings={headings} />
    </div>
  );
}
