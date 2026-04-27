import type { ContributeRouteMatch } from "./types";

const CONTRIBUTE_ROUTE = "/contribute";

export function matchContributeRoute(pathname: string): ContributeRouteMatch {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalized === CONTRIBUTE_ROUTE) {
    return { kind: "page", pageId: "contribute" };
  }

  return { kind: "none" };
}

export function getContributePageUrl(): string {
  return CONTRIBUTE_ROUTE;
}
