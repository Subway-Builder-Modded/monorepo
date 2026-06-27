import { createSimpleRouteMatcher } from "@/lib/routing";
import { DEFAULT_REGISTRY_TYPE_ID } from "@/features/registry/registry-type-config";

const REGISTRY_ROUTE = "/registry";
const registryRoute = createSimpleRouteMatcher(REGISTRY_ROUTE, "registry");
const REGISTRY_DETAIL_TABS = new Set([
  "description",
  "analytics",
  "gallery",
  "versions",
  "map",
  "details",
]);
const REGISTRY_AUTHOR_TABS = new Set(["overview", "projects", "analytics"]);
const REGISTRY_ANALYTICS_TABS = new Set(["overview", "content", "authors", "map-statistics"]);
const REGISTRY_ANALYTICS_PERIODS = new Set(["all-time", "3d", "7d", "14d"]);

export type RegistryRouteMatch =
  | { kind: "none" }
  | { kind: "page"; pageId: "registry" }
  | { kind: "analytics"; tabId?: string; periodId?: string }
  | { kind: "creatorDatabase"; tabId?: "authors" | "projects" }
  | { kind: "author"; authorId: string; tabId?: string }
  | { kind: "project"; authorId: string; projectName: string; tabId?: string }
  | { kind: "detail"; routeSegment: string; id: string; tabId?: string; versionId?: string };

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
    if (routeSegment === "authors") {
      return { kind: "creatorDatabase", tabId: "authors" };
    }

    if (routeSegment === "analytics") {
      return { kind: "analytics", tabId: "overview", periodId: "all-time" };
    }

    if (routeSegment === "maps" || routeSegment === "mods") {
      return {
        kind: "page",
        pageId: "registry",
      };
    }
  }

  if (segments.length === 3 && segments[0] === "registry") {
    if (segments[1] === "analytics") {
      const tabId = decodeURIComponent(segments[2] ?? "");
      if (!REGISTRY_ANALYTICS_TABS.has(tabId)) {
        return { kind: "none" };
      }

      return {
        kind: "analytics",
        tabId,
        periodId: tabId === "overview" ? "all-time" : undefined,
      };
    }

    if (segments[1] === "authors") {
      if (segments[2] === "projects") {
        return { kind: "creatorDatabase", tabId: "projects" };
      }

      return {
        kind: "author",
        authorId: decodeURIComponent(segments[2] ?? ""),
      };
    }

    return {
      kind: "detail",
      routeSegment: decodeURIComponent(segments[1] ?? ""),
      id: decodeURIComponent(segments[2] ?? ""),
    };
  }

  if (segments.length === 4 && segments[0] === "registry") {
    const tabId = decodeURIComponent(segments[3] ?? "");
    if (segments[1] === "analytics") {
      if (segments[2] !== "overview" || !REGISTRY_ANALYTICS_PERIODS.has(tabId)) {
        return { kind: "none" };
      }

      return {
        kind: "analytics",
        tabId: "overview",
        periodId: tabId,
      };
    }

    if (segments[1] === "authors") {
      if (!REGISTRY_AUTHOR_TABS.has(tabId)) {
        return {
          kind: "project",
          authorId: decodeURIComponent(segments[2] ?? ""),
          projectName: tabId,
        };
      }

      return {
        kind: "author",
        authorId: decodeURIComponent(segments[2] ?? ""),
        tabId,
      };
    }

    if (!REGISTRY_DETAIL_TABS.has(tabId)) {
      return { kind: "none" };
    }

    return {
      kind: "detail",
      routeSegment: decodeURIComponent(segments[1] ?? ""),
      id: decodeURIComponent(segments[2] ?? ""),
      tabId,
    };
  }

  if (segments.length === 5 && segments[0] === "registry") {
    if (segments[1] === "authors") {
      const tabId = decodeURIComponent(segments[4] ?? "");
      if (!REGISTRY_AUTHOR_TABS.has(tabId)) {
        return { kind: "none" };
      }

      return {
        kind: "project",
        authorId: decodeURIComponent(segments[2] ?? ""),
        projectName: decodeURIComponent(segments[3] ?? ""),
        tabId,
      };
    }

    const tabId = decodeURIComponent(segments[3] ?? "");
    if (tabId !== "versions") {
      return { kind: "none" };
    }

    return {
      kind: "detail",
      routeSegment: decodeURIComponent(segments[1] ?? ""),
      id: decodeURIComponent(segments[2] ?? ""),
      tabId,
      versionId: decodeURIComponent(segments[4] ?? ""),
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

export function getRegistryDetailUrl(routeSegment: string, id: string, tabId?: string): string {
  const base = `${REGISTRY_ROUTE}/${encodeURIComponent(routeSegment)}/${encodeURIComponent(id)}`;
  if (!tabId) {
    return base;
  }

  return `${base}/${encodeURIComponent(tabId)}`;
}

export function getRegistryAuthorUrl(authorId: string, tabId?: string): string {
  const base = `${REGISTRY_ROUTE}/authors/${encodeURIComponent(authorId)}`;
  if (!tabId || tabId === "overview") {
    return base;
  }
  return `${base}/${encodeURIComponent(tabId)}`;
}

export function getRegistryProjectUrl(
  authorId: string,
  projectName: string,
  tabId?: string,
): string {
  const base = `${REGISTRY_ROUTE}/authors/${encodeURIComponent(authorId)}/${encodeURIComponent(projectName)}`;
  if (!tabId || tabId === "overview") {
    return base;
  }
  return `${base}/${encodeURIComponent(tabId)}`;
}

export function getRegistryVersionUrl(routeSegment: string, id: string, version: string): string {
  return `${getRegistryDetailUrl(routeSegment, id, "versions")}/${encodeURIComponent(version)}`;
}
