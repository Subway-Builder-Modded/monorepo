import type { CreditsRouteMatch } from "./types";

const CREDITS_ROUTE = "/credits";

export function matchCreditsRoute(pathname: string): CreditsRouteMatch {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalized === CREDITS_ROUTE) {
    return { kind: "page", pageId: "credits" };
  }

  return { kind: "none" };
}

export function getCreditsPageUrl(): string {
  return CREDITS_ROUTE;
}
