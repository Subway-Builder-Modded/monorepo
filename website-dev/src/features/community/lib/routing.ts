import type { CommunityRouteMatch } from "./types";

const COMMUNITY_ROUTE = "/community";

export function matchCommunityRoute(pathname: string): CommunityRouteMatch {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalized === COMMUNITY_ROUTE) {
    return { kind: "page", pageId: "community" };
  }

  return { kind: "none" };
}

export function getCommunityPageUrl(): string {
  return COMMUNITY_ROUTE;
}
