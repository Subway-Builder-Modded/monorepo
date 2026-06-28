export type DepotPageId = "depot";

export type DepotRouteMatch = { kind: "none" } | { kind: "page"; pageId: DepotPageId };
