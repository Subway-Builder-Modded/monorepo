import type {
  RailyardAnalyticsPeriodId,
  RailyardAnalyticsTabId,
  RailyardRouteMatch,
} from "./types";
import { createSimpleRouteMatcher } from "@/lib/routing";

const RAILYARD_ROUTE = "/railyard";
const railyardRoute = createSimpleRouteMatcher(RAILYARD_ROUTE, "railyard");
const RAILYARD_ANALYTICS_ROUTE = "/railyard/analytics";
const RAILYARD_ANALYTICS_TABS = new Set<RailyardAnalyticsTabId>([
  "overview",
  "timeline",
  "versions",
  "operating-systems",
]);
const RAILYARD_ANALYTICS_PERIODS = new Set<RailyardAnalyticsPeriodId>([
  "all-time",
  "3d",
  "7d",
  "14d",
]);
const RAILYARD_ANALYTICS_PERIOD_TABS = new Set<RailyardAnalyticsTabId>(["timeline", "versions"]);

export function matchRailyardRoute(pathname: string): RailyardRouteMatch {
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  if (normalized === RAILYARD_ANALYTICS_ROUTE) {
    return { kind: "page", pageId: "analytics", tabId: "overview" };
  }

  if (normalized.startsWith(`${RAILYARD_ANALYTICS_ROUTE}/`)) {
    const segments = normalized.slice(`${RAILYARD_ANALYTICS_ROUTE}/`.length).split("/");
    const [tabId, periodId, extraSegment] = segments;
    if (RAILYARD_ANALYTICS_TABS.has(tabId as RailyardAnalyticsTabId)) {
      if (extraSegment) return { kind: "none" };

      if (periodId) {
        if (
          !RAILYARD_ANALYTICS_PERIOD_TABS.has(tabId as RailyardAnalyticsTabId) ||
          !RAILYARD_ANALYTICS_PERIODS.has(periodId as RailyardAnalyticsPeriodId)
        ) {
          return { kind: "none" };
        }

        return {
          kind: "page",
          pageId: "analytics",
          tabId: tabId as RailyardAnalyticsTabId,
          periodId: periodId as RailyardAnalyticsPeriodId,
        };
      }

      return {
        kind: "page",
        pageId: "analytics",
        tabId: tabId as RailyardAnalyticsTabId,
        periodId: RAILYARD_ANALYTICS_PERIOD_TABS.has(tabId as RailyardAnalyticsTabId)
          ? "all-time"
          : undefined,
      };
    }

    return { kind: "none" };
  }

  return railyardRoute.match(pathname);
}

export function getRailyardPageUrl(): string {
  return railyardRoute.getUrl();
}
