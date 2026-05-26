import { createSimpleRouteMatcher } from "@/lib/routing";
import { DEFAULT_REGISTRY_TYPE_ID } from "@/features/registry/registry-type-config";

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
  if (segments.length === 2 && segments[0] === "registry") {
    const routeSegment = segments[1] ?? "";
    if (routeSegment === "maps" || routeSegment === "mods") {
      return {
        kind: "page",
        pageId: "registry",
      };
    }
  }

  if (segments.length === 3 && segments[0] === "registry") {
    return {
      kind: "detail",
      routeSegment: decodeURIComponent(segments[1] ?? ""),
      id: decodeURIComponent(segments[2] ?? ""),
    };
  }

  return { kind: "none" };
}

export function getRegistryPageUrl(typeId: string = DEFAULT_REGISTRY_TYPE_ID): string {
  return `${REGISTRY_ROUTE}/${encodeURIComponent(typeId)}`;
}

export function getRegistryTagBrowseUrl(typeId: string, tag: string): string {
  const search = new URLSearchParams({ tags: tag }).toString();
  return `${getRegistryPageUrl(typeId)}?${search}`;
}

export function getRegistryDetailUrl(routeSegment: string, id: string): string {
  return `${REGISTRY_ROUTE}/${encodeURIComponent(routeSegment)}/${encodeURIComponent(id)}`;
}
