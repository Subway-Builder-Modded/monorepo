export type RailyardPageId = "railyard";

export type RailyardRouteMatch =
  | {
      kind: "none";
    }
  | {
      kind: "page";
      pageId: RailyardPageId;
    };
