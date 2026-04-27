import { useState, useMemo } from "react";
import { SuiteAccentLink, SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { Link } from "@/lib/router";
import { getSuiteById } from "@/config/site-navigation";
import { getDocsVersion } from "@/config/docs";
import type { DocsSuiteId } from "@/config/docs";
import {
  getDocsTree,
  findTreeNode,
  loadDocContent,
  getDocRawContent,
  getDocSourcePath,
  getEditUrl,
} from "@/features/docs/lib/content";
import { AsyncArticleContent } from "@/features/content/components/async-article-content";
import { extractHeadings } from "@/features/docs/lib/headings";
import { getDocsHomepageUrl } from "@/features/docs/lib/routing";
import { mdxComponents } from "@/features/docs/mdx/components";
import { DocsRouteProvider } from "@/features/docs/mdx/docs-route-context";
import { resolveLucideIcon as resolveIcon } from "@/features/content/lib/icon-resolver";
import { DocsSidebar, MobileDocsSidebar } from "./sidebar";
import { OnThisPage } from "./on-this-page";
import { FileQuestion } from "lucide-react";
import { DocsDeprecatedNotice } from "./docs-deprecated-notice";
import { DocsBreadcrumbs } from "./docs-breadcrumbs";
import { DocsPageTitleCard } from "./docs-page-title-card";

const SIDEBAR_COLLAPSED_KEY = "sbm:docs-sidebar-collapsed";

function getInitialSidebarCollapsedState() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsedState);
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
                  <AsyncArticleContent
                    sourcePath={sourcePath}
                    loadContent={loadDocContent}
                    components={mdxComponents}
                    loadingLines={3}
                  />
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
