import { useLocation } from "@/lib/router";
import { matchRegistryRoute } from "@/features/registry/lib/routing";
import { RegistryPage } from "@/features/registry/registry-page";
import { RegistryDetailPage } from "@/features/registry/detail/registry-detail-page";

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

  return null;
}
