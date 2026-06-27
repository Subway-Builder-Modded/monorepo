import { useLocation } from "@/lib/router";
import { matchRegistryRoute } from "@/features/registry/lib/routing";
import { RegistryPage } from "@/features/registry/registry-page";
import { RegistryDetailPage } from "@/features/registry/detail/registry-detail-page";
import {
  RegistryAuthorPage,
  RegistryProjectPage,
} from "@/features/registry/authors/registry-author-page";
import { RegistryCreatorDatabasePage } from "@/features/registry/authors/registry-creator-database-page";
import {
  RegistryAnalyticsPage,
  type RegistryAnalyticsTabId,
} from "@/features/registry/analytics/registry-analytics-page";
import type { RegistryAnalyticsPeriodId } from "@/features/registry/analytics/lib/load-registry-analytics";

export function RegistryRoute() {
  const location = useLocation();
  const match = matchRegistryRoute(location.pathname);

  if (match.kind === "page") {
    return <RegistryPage />;
  }

  if (match.kind === "creatorDatabase") {
    return <RegistryCreatorDatabasePage tabId={match.tabId} />;
  }

  if (match.kind === "analytics") {
    return (
      <RegistryAnalyticsPage
        tabId={match.tabId as RegistryAnalyticsTabId}
        periodId={match.periodId as RegistryAnalyticsPeriodId}
      />
    );
  }

  if (match.kind === "detail") {
    return (
      <RegistryDetailPage
        routeSegment={match.routeSegment}
        id={match.id}
        tabId={match.tabId}
        versionId={match.versionId}
      />
    );
  }

  if (match.kind === "author") {
    return <RegistryAuthorPage authorId={match.authorId} tabId={match.tabId} />;
  }

  if (match.kind === "project") {
    return (
      <RegistryProjectPage
        authorId={match.authorId}
        projectName={match.projectName}
        tabId={match.tabId}
      />
    );
  }

  return null;
}
