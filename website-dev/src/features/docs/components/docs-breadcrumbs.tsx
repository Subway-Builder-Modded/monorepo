import { ChevronRight } from "lucide-react";
import { Link } from "@/lib/router";
import { getSuiteById } from "@/config/site-navigation";
import { getDocsHomepageUrl, getDocPageUrl } from "@/features/docs/lib/routing";
import { hasMultipleVisibleVersions, type DocsSuiteId } from "@/config/docs";

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
  const showVersion = hasMultipleVisibleVersions(suiteId) && !!version;
  const breadcrumbVersion = version?.startsWith("v") ? version : version ? `v${version}` : null;
  const firstCrumb = showVersion
    ? `${suite.title} Documentation (${breadcrumbVersion})`
    : `${suite.title} Documentation`;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            to={getDocsHomepageUrl(suiteId, version)}
            className="text-muted-foreground no-underline hover:text-[var(--suite-accent-light)] hover:no-underline dark:hover:text-[var(--suite-accent-dark)]"
          >
            {firstCrumb}
          </Link>
        </li>
        {parts.length > 1 &&
          parts.slice(0, -1).map((part, i) => {
            const parentSlug = parts.slice(0, i + 1).join("/");
            return (
              <li key={i} className="flex items-center gap-1">
                <ChevronRight className="size-3" aria-hidden="true" />
                <Link
                  to={getDocPageUrl(suiteId, version, parentSlug)}
                  className="capitalize text-muted-foreground no-underline hover:text-[var(--suite-accent-light)] hover:no-underline dark:hover:text-[var(--suite-accent-dark)]"
                >
                  {part.replace(/-/g, " ")}
                </Link>
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
