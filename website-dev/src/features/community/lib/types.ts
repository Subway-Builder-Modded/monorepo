export type CommunityPageId = "community";

export type CommunityRouteMatch = { kind: "none" } | { kind: "page"; pageId: CommunityPageId };
