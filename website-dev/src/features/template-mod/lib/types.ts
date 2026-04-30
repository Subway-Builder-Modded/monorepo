export type TemplateModPageId = "template-mod";

export type TemplateModRouteMatch =
  | { kind: "none" }
  | { kind: "page"; pageId: TemplateModPageId };
