import { createSimpleRouteMatcher } from "@/lib/routing";

const REGISTRY_ROUTE = "/registry";
const registryRoute = createSimpleRouteMatcher(REGISTRY_ROUTE, "registry");

// Reuse the same match shape pattern as other features
export type RegistryRouteMatch = { kind: "none" } | { kind: "page"; pageId: "registry" };

export function matchRegistryRoute(pathname: string): RegistryRouteMatch {
  return registryRoute.match(pathname) as RegistryRouteMatch;
}

export function getRegistryPageUrl(): string {
  return registryRoute.getUrl();
}
