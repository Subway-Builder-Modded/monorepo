import type { CreditsRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const CREDITS_ROUTE = "/credits";
const creditsRoute = createSimpleRouteMatcher(CREDITS_ROUTE, "credits");

export function matchCreditsRoute(pathname: string): CreditsRouteMatch {
  return creditsRoute.match(pathname);
}

export function getCreditsPageUrl(): string {
  return creditsRoute.getUrl();
}
