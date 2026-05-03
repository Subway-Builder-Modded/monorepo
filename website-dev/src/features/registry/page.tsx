import { useLocation } from "@/lib/router";
import { matchRegistryRoute } from "@/features/registry/lib/routing";
import { RegistryPage } from "@/features/registry/registry-page";

export function RegistryRoute() {
  const location = useLocation();
  const match = matchRegistryRoute(location.pathname);

  if (match.kind !== "page") {
    return null;
  }

  return <RegistryPage />;
}
