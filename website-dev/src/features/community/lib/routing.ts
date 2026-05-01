import type { CommunityRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const COMMUNITY_ROUTE = "/community";
const communityRoute = createSimpleRouteMatcher(COMMUNITY_ROUTE, "community");

export function matchCommunityRoute(pathname: string): CommunityRouteMatch {
  return communityRoute.match(pathname);
}

export function getCommunityPageUrl(): string {
  return communityRoute.getUrl();
}
