import type { RailyardRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const RAILYARD_ROUTE = "/railyard";
const railyardRoute = createSimpleRouteMatcher(RAILYARD_ROUTE, "railyard");

export function matchRailyardRoute(pathname: string): RailyardRouteMatch {
  return railyardRoute.match(pathname);
}

export function getRailyardPageUrl(): string {
  return railyardRoute.getUrl();
}
