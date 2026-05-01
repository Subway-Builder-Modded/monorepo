import { useLocation } from "@/lib/router";
import { matchDepotRoute } from "@/features/depot/lib/routing";
import { DepotPage } from "@/features/depot/depot-page";

export function DepotRoute() {
  const location = useLocation();
  const match = matchDepotRoute(location.pathname);

  if (match.kind !== "page") {
    return null;
  }

  return <DepotPage />;
}
