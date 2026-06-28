type SimpleRouteMatch<TPageId extends string> =
  | { kind: "none" }
  | { kind: "page"; pageId: TPageId };

function normalizePathname(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

export function createSimpleRouteMatcher<TPageId extends string>(route: string, pageId: TPageId) {
  return {
    match(pathname: string): SimpleRouteMatch<TPageId> {
      const normalized = normalizePathname(pathname);
      if (normalized === route) {
        return { kind: "page", pageId };
      }

      return { kind: "none" };
    },
    getUrl(): string {
      return route;
    },
  };
}
