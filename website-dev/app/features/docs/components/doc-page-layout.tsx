import { useState, useEffect, useMemo, Suspense } from "react";
import { SuiteAccentLink, SuiteAccentScope } from "@subway-builder-modded/shared-ui";
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
import { getDocsHomepageUrl } from "@/app/features/docs/lib/routing";
import { mdxComponents } from "@/app/features/docs/mdx/components";
import { DocsRouteProvider } from "@/app/features/docs/mdx/docs-route-context";
import { resolveIcon } from "@/app/features/docs/lib/icon-resolver";
import { DocsSidebar, MobileDocsSidebar } from "./sidebar";
import { OnThisPage } from "./on-this-page";
import { FileQuestion } from "lucide-react";
import { DocsDeprecatedNotice } from "./docs-deprecated-notice";
import { DocsBreadcrumbs } from "./docs-breadcrumbs";
import { DocsPageTitleCard } from "./docs-page-title-card";

function DocContent({ sourcePath }: { sourcePath: string }) {
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const tree = getDocsTree(suiteId, version);
  const node = findTreeNode(tree, slug);
  const versionConfig = version ? getDocsVersion(suiteId, version) : null;
  const isDeprecated = versionConfig?.status === "deprecated";

  const sourcePath = node?.sourcePath ?? getDocSourcePath(suiteId, version, slug);
  const rawContent = getDocRawContent(sourcePath);
  const headings = useMemo(() => (rawContent ? extractHeadings(rawContent) : []), [rawContent]);
  const editUrl = getEditUrl(suiteId, version, slug);
  const suite = getSuiteById(suiteId);
  const Icon = node ? resolveIcon(node.frontmatter.icon) : null;

  if (!node) {
    return (
      <SuiteAccentScope accent={suite.accent}>
        <div className="py-6 lg:py-8">
          <div
            className="grid gap-4 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(.22,.9,.35,1)] lg:[grid-template-columns:var(--docs-sidebar-width)_minmax(0,1fr)] xl:[grid-template-columns:var(--docs-sidebar-width)_minmax(0,1fr)_15rem]"
            style={{ ["--docs-sidebar-width" as string]: sidebarCollapsed ? "2.75rem" : "17.5rem" }}
          >
            <DocsSidebar
              tree={tree}
              suiteId={suiteId}
              currentVersion={version}
              currentSlug={null}
              onCollapsedChange={setSidebarCollapsed}
            />

            <div className="min-w-0 rounded-2xl border-2 border-border/60 bg-background/75 p-8 text-center">
              <div className="flex flex-col items-center gap-4 py-12">
                <FileQuestion className="size-12 text-muted-foreground" aria-hidden={true} />
                <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
                <p className="text-sm text-muted-foreground">
                  The documentation page &quot;{slug}&quot; was not found
                  {version ? ` in ${version}` : ""}.
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
      <div className="py-6 lg:py-8">
        <div
          className="grid gap-4 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(.22,.9,.35,1)] lg:[grid-template-columns:var(--docs-sidebar-width)_minmax(0,1fr)] xl:[grid-template-columns:var(--docs-sidebar-width)_minmax(0,1fr)_15rem]"
          style={{ ["--docs-sidebar-width" as string]: sidebarCollapsed ? "2.75rem" : "17.5rem" }}
        >
          <DocsSidebar
            tree={tree}
            suiteId={suiteId}
            currentVersion={version}
            currentSlug={slug}
            onCollapsedChange={setSidebarCollapsed}
          />

          <article className="min-w-0">
            <MobileDocsSidebar
              tree={tree}
              suiteId={suiteId}
              currentVersion={version}
              currentSlug={slug}
            />

            {isDeprecated && version ? (
              <DocsDeprecatedNotice suiteId={suiteId} version={version} currentSlug={slug} />
            ) : null}

            <DocsBreadcrumbs
              suiteId={suiteId}
              version={version}
              slug={slug}
              title={node.frontmatter.title}
            />

            <DocsPageTitleCard
              title={node.frontmatter.title}
              description={node.frontmatter.description}
              icon={Icon}
            />

            <section className="px-1 py-2 sm:px-2 sm:py-3">
              <div className="prose-docs max-w-none">
                <DocsRouteProvider value={{ suiteId, version, slug }}>
                  <DocContent sourcePath={sourcePath} />
                </DocsRouteProvider>
              </div>
            </section>
          </article>

          <OnThisPage headings={headings} editUrl={editUrl} rawContent={rawContent} />
        </div>
      </div>
    </SuiteAccentScope>
  );
}
