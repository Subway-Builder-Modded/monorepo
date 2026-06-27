import { describe, expect, it } from "vitest";
import { matchRailyardRoute } from "./routing";

describe("matchRailyardRoute", () => {
  it("matches the railyard homepage", () => {
    expect(matchRailyardRoute("/railyard")).toEqual({
      kind: "page",
      pageId: "railyard",
    });
  });

  it("matches the railyard analytics page", () => {
    expect(matchRailyardRoute("/railyard/analytics")).toEqual({
      kind: "page",
      pageId: "analytics",
      tabId: "overview",
    });
    expect(matchRailyardRoute("/railyard/analytics/overview")).toEqual({
      kind: "page",
      pageId: "analytics",
      tabId: "overview",
    });
    expect(matchRailyardRoute("/railyard/analytics/timeline")).toEqual({
      kind: "page",
      pageId: "analytics",
      tabId: "timeline",
      periodId: "all-time",
    });
    expect(matchRailyardRoute("/railyard/analytics/timeline/7d")).toEqual({
      kind: "page",
      pageId: "analytics",
      tabId: "timeline",
      periodId: "7d",
    });
    expect(matchRailyardRoute("/railyard/analytics/versions/14d")).toEqual({
      kind: "page",
      pageId: "analytics",
      tabId: "versions",
      periodId: "14d",
    });
    expect(matchRailyardRoute("/railyard/analytics/operating-systems/3d")).toEqual({
      kind: "page",
      pageId: "analytics",
      tabId: "operating-systems",
      periodId: "3d",
    });
  });

  it("returns none for unrelated railyard subroutes", () => {
    expect(matchRailyardRoute("/railyard/not-found")).toEqual({ kind: "none" });
    expect(matchRailyardRoute("/railyard/analytics/overview/7d")).toEqual({ kind: "none" });
    expect(matchRailyardRoute("/railyard/analytics/timeline/nope")).toEqual({ kind: "none" });
  });
});
