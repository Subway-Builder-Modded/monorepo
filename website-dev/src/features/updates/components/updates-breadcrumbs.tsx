import { ChevronRight } from "lucide-react";
import { Link } from "@/lib/router";
import { getSuiteById } from "@/config/site-navigation";
import type { UpdatesSuiteId } from "@/config/updates";
import { findUpdateEntry } from "@/features/updates/lib/content";
import { getUpdatePageUrl, getUpdatesHomepageUrl } from "@/features/updates/lib/routing";

export function UpdatesBreadcrumbs({
  suiteId,
  slug,
  title,
}: {
  suiteId: UpdatesSuiteId;
  slug: string;
  title: string;
}) {
  const suite = getSuiteById(suiteId);
  const parts = slug.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            to={getUpdatesHomepageUrl(suiteId)}
            className="text-muted-foreground no-underline hover:text-[var(--suite-accent-light)] hover:no-underline dark:hover:text-[var(--suite-accent-dark)]"
          >
            {suite.title} Updates
          </Link>
        </li>
        {parts.length > 1
          ? parts.slice(0, -1).map((_, i) => {
              const parentSlug = parts.slice(0, i + 1).join("/");
              const parentTitle = findUpdateEntry(suiteId, parentSlug)?.frontmatter.title;
              return (
                <li key={parentSlug} className="flex items-center gap-1">
                  <ChevronRight className="size-3" aria-hidden="true" />
                  <Link
                    to={getUpdatePageUrl(suiteId, parentSlug)}
                    className="text-muted-foreground no-underline hover:text-[var(--suite-accent-light)] hover:no-underline dark:hover:text-[var(--suite-accent-dark)]"
                  >
                    {parentTitle ?? parts[i].replace(/-/g, " ")}
                  </Link>
                </li>
              );
            })
          : null}
        <li className="flex items-center gap-1">
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="max-w-[320px] truncate font-medium text-foreground">{title}</span>
        </li>
      </ol>
    </nav>
  );
}
