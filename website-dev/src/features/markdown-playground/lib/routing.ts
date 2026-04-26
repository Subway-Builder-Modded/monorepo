import type { MarkdownPlaygroundRouteMatch } from "./types";

const REGISTRY_MARKDOWN_PLAYGROUND_ROUTE = "/registry/markdown-playground";

export function matchMarkdownPlaygroundRoute(pathname: string): MarkdownPlaygroundRouteMatch {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalized === REGISTRY_MARKDOWN_PLAYGROUND_ROUTE) {
    return { kind: "page", pageId: "registry-markdown-playground" };
  }

  return { kind: "none" };
}

export function getMarkdownPlaygroundUrl(): string {
  return REGISTRY_MARKDOWN_PLAYGROUND_ROUTE;
}
