import { createSimpleRouteMatcher } from "@/lib/routing";

const REGISTRY_ROUTE = "/registry";
const registryRoute = createSimpleRouteMatcher(REGISTRY_ROUTE, "registry");

export type RegistryRouteMatch =
  | { kind: "none" }
  | { kind: "page"; pageId: "registry" }
  | { kind: "detail"; routeSegment: string; id: string };

function normalizePathname(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

export function matchRegistryRoute(pathname: string): RegistryRouteMatch {
  const simpleMatch = registryRoute.match(pathname) as RegistryRouteMatch;
  if (simpleMatch.kind === "page") {
    return simpleMatch;
  }

  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 3 && segments[0] === "registry") {
    return {
      kind: "detail",
      routeSegment: decodeURIComponent(segments[1] ?? ""),
      id: decodeURIComponent(segments[2] ?? ""),
    };
  }

  return { kind: "none" };
}

export function getRegistryPageUrl(): string {
  return registryRoute.getUrl();
}

export function getRegistryDetailUrl(routeSegment: string, id: string): string {
  return `${REGISTRY_ROUTE}/${encodeURIComponent(routeSegment)}/${encodeURIComponent(id)}`;
}
