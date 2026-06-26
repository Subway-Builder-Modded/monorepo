import { useLocation } from "@/lib/router";
import { matchRegistryRoute } from "@/features/registry/lib/routing";
import { RegistryPage } from "@/features/registry/registry-page";
import { RegistryDetailPage } from "@/features/registry/detail/registry-detail-page";
import {
  RegistryAuthorPage,
  RegistryProjectPage,
} from "@/features/registry/authors/registry-author-page";

export function RegistryRoute() {
  const location = useLocation();
  const match = matchRegistryRoute(location.pathname);

  if (match.kind === "page") {
    return <RegistryPage />;
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
