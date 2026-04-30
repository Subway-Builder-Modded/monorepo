import type { TemplateModRouteMatch } from "./types";

const TEMPLATE_MOD_ROUTE = "/template-mod";

export function matchTemplateModRoute(pathname: string): TemplateModRouteMatch {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized =
    withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;

  if (normalized === TEMPLATE_MOD_ROUTE) {
    return { kind: "page", pageId: "template-mod" };
  }

  return { kind: "none" };
}

export function getTemplateModPageUrl(): string {
  return TEMPLATE_MOD_ROUTE;
}
