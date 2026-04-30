import type { MarkdownPlaygroundRouteMatch } from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const REGISTRY_MARKDOWN_PLAYGROUND_ROUTE = "/registry/markdown-playground";
const markdownPlaygroundRoute = createSimpleRouteMatcher(
  REGISTRY_MARKDOWN_PLAYGROUND_ROUTE,
  "registry-markdown-playground",
);

export function matchMarkdownPlaygroundRoute(pathname: string): MarkdownPlaygroundRouteMatch {
  return markdownPlaygroundRoute.match(pathname);
}

export function getMarkdownPlaygroundUrl(): string {
  return markdownPlaygroundRoute.getUrl();
}
