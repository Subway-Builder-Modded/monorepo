import type { TemplateModRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const TEMPLATE_MOD_ROUTE = "/template-mod";
const templateModRoute = createSimpleRouteMatcher(TEMPLATE_MOD_ROUTE, "template-mod");

export function matchTemplateModRoute(pathname: string): TemplateModRouteMatch {
  return templateModRoute.match(pathname);
}

export function getTemplateModPageUrl(): string {
  return templateModRoute.getUrl();
}
