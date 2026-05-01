import type { ContributeRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const CONTRIBUTE_ROUTE = "/contribute";
const contributeRoute = createSimpleRouteMatcher(CONTRIBUTE_ROUTE, "contribute");

export function matchContributeRoute(pathname: string): ContributeRouteMatch {
  return contributeRoute.match(pathname);
}

export function getContributePageUrl(): string {
  return contributeRoute.getUrl();
}
