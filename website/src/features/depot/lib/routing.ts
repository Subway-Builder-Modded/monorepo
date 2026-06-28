import type { DepotRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const DEPOT_ROUTE = "/depot";
const depotRoute = createSimpleRouteMatcher(DEPOT_ROUTE, "depot");

export function matchDepotRoute(pathname: string): DepotRouteMatch {
  return depotRoute.match(pathname);
}

export function getDepotPageUrl(): string {
  return depotRoute.getUrl();
}
