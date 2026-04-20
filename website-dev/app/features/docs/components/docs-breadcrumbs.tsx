import { ChevronRight } from "lucide-react";
import { SuiteAccentLink } from "@subway-builder-modded/shared-ui";
import { Link } from "@/app/lib/router";
import { getSuiteById } from "@/app/config/site-navigation";
import { getDocsHomepageUrl, getDocPageUrl } from "@/app/features/docs/lib/routing";
import { isVersionedDocsSuite, type DocsSuiteId } from "@/app/config/docs";

export function DocsBreadcrumbs({
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
          <span className="max-w-[200px] truncate font-medium text-foreground">{title}</span>
        </li>
      </ol>
    </nav>
  );
}
