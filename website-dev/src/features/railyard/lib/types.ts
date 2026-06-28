export type RailyardPageId = "railyard" | "analytics";
export type RailyardAnalyticsTabId = "overview" | "timeline" | "versions" | "operating-systems";
export type RailyardAnalyticsPeriodId = "all-time" | "3d" | "7d" | "14d";

export type RailyardRouteMatch =
  | {
      kind: "none";
    }
  | {
      kind: "page";
      pageId: RailyardPageId;
      tabId?: RailyardAnalyticsTabId;
      periodId?: RailyardAnalyticsPeriodId;
    };
