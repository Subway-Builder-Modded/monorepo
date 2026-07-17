import { FileQuestion } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeading, SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { useLocation } from "@/lib/router";
import { createSimpleRouteMatcher } from "@/lib/routing";
import { getMatchingItem, getSuiteById } from "@/config/site-navigation";
import { articleMdxComponents } from "@/features/content/mdx";
import { AsyncArticleContent } from "@/features/content/components/async-article-content";

type LegalPageProps = {
  routePath: string;
  sourcePath: string;
  loadContent: () => Promise<React.ComponentType | null>;
};

export function LegalPage({ routePath, sourcePath, loadContent }: LegalPageProps) {
  const location = useLocation();
  const match = createSimpleRouteMatcher(routePath, "page").match(location.pathname);

  if (match.kind !== "page") return null;

  const navItem = getMatchingItem(location.pathname, "general");
  if (!navItem) {
    return (
      <div className="flex flex-col items-center gap-[clamp(0.65rem,1.5vw,1rem)] py-[clamp(2rem,8vw,5rem)] text-center">
        <FileQuestion
          className="size-[clamp(1.9rem,5.5vw,3rem)] text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold text-foreground">
          Page Not Found
        </h1>
        <p className="text-[clamp(0.85rem,1.2vw,1rem)] text-muted-foreground">
          The page "{location.pathname}" was not found.
        </p>
      </div>
    );
  }

  const Icon = navItem.icon as LucideIcon;
  const suite = getSuiteById(navItem.suiteId);

  return (
    <SuiteAccentScope accent={suite.accent}>
      <section className="py-[clamp(1.1rem,3vw,2rem)]">
        <PageHeading icon={Icon} title={navItem.title} description={navItem.description} />
        <div className="py-[clamp(1rem,2.8vw,2rem)]">
          <AsyncArticleContent
            sourcePath={sourcePath}
            loadContent={loadContent}
            components={articleMdxComponents}
            loadingLines={5}
          />
        </div>
      </section>
    </SuiteAccentScope>
  );
}
