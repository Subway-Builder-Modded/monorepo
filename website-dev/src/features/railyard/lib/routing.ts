import type { RailyardRouteMatch } from "./types";

const RAILYARD_ROUTE = "/railyard";

export function matchRailyardRoute(pathname: string): RailyardRouteMatch {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized =
    withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;

  if (normalized === RAILYARD_ROUTE) {
    return { kind: "page", pageId: "railyard" };
  }

  return { kind: "none" };
}

export function getRailyardPageUrl(): string {
  return RAILYARD_ROUTE;
}
