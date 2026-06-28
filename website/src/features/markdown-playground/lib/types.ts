export type MarkdownPlaygroundPageId = "registry-markdown-playground";

export type MarkdownPlaygroundRouteMatch =
  | { kind: "none" }
  | { kind: "page"; pageId: MarkdownPlaygroundPageId };

export type MarkdownPlaygroundMode = "markdown" | "rich";
