import { FileQuestion } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeading, SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { useLocation } from "@/lib/router";
import { matchLicenseRoute } from "@/features/license/lib/routing";
import { loadLicensePage } from "@/features/license/lib/content";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import { articleMdxComponents } from "@/features/content/mdx";
import { AsyncArticleContent } from "@/features/content/components/async-article-content";

export function LicenseRoute() {
  const location = useLocation();
  const match = matchLicenseRoute(location.pathname);

  if (match.kind !== "page") {
    return null;
  }

  const navItem = getMatchingItem(location.pathname, "general");

  if (!navItem) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <FileQuestion className="size-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-bold text-foreground">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The page "{location.pathname}" was not found.
        </p>
      </div>
    );
  }

  const Icon = navItem.icon as LucideIcon;
  const suite = getSuiteById(navItem.suiteId);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-6 lg:py-8">
        <PageHeading icon={Icon} title={navItem.title} description={navItem.description} />

        <div className="py-8">
          <AsyncArticleContent
            sourcePath="/content/license/gpl-3.0.mdx"
            loadContent={async () => {
              return loadLicensePage();
            }}
            components={articleMdxComponents}
            loadingLines={5}
          />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
