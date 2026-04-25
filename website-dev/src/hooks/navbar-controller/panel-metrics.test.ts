import { describe, expect, it } from "vitest";
import {
  INITIAL_COMMITTED_PANEL_METRICS,
  NAVBAR_TOP_OFFSET,
  PANEL_BODY_VERTICAL_PADDING,
  PANEL_MIN_HEIGHT,
  PANEL_VIEWPORT_BOTTOM_GUTTER,
  TOP_BAR_HEIGHT,
} from "@/hooks/navbar-controller/constants";
import {
  getNextCommittedPanelMetrics,
  getTargetPanelMetrics,
} from "@/hooks/navbar-controller/panel-metrics";

const OVERHEAD = NAVBAR_TOP_OFFSET + TOP_BAR_HEIGHT + PANEL_VIEWPORT_BOTTOM_GUTTER;

describe("getTargetPanelMetrics", () => {
  it("returns PANEL_MIN_HEIGHT when measured height is below minimum", () => {
    const { targetPanelHeight, targetPanelNeedsScroll } = getTargetPanelMetrics({
      viewportHeight: 900,
      measuredPanelHeight: 0,
    });
    // measuredNaturalPanelHeight = max(PANEL_MIN_HEIGHT, 0 + PANEL_BODY_VERTICAL_PADDING) = PANEL_MIN_HEIGHT
    // maxPanelHeight = max(PANEL_MIN_HEIGHT, 900 - OVERHEAD) = large value
    // targetPanelHeight = min(PANEL_MIN_HEIGHT, large) = PANEL_MIN_HEIGHT
    expect(targetPanelHeight).toBe(PANEL_MIN_HEIGHT);
    expect(targetPanelNeedsScroll).toBe(false);
  });

  it("clamps height to max and sets panelNeedsScroll when content is taller than viewport allows", () => {
    const viewportHeight = 200;
    const measuredPanelHeight = 500;
    const expectedMax = Math.max(PANEL_MIN_HEIGHT, viewportHeight - OVERHEAD);

    const { targetPanelHeight, targetPanelNeedsScroll } = getTargetPanelMetrics({
      viewportHeight,
      measuredPanelHeight,
    });

    expect(targetPanelHeight).toBe(expectedMax);
    expect(targetPanelNeedsScroll).toBe(true);
  });

  it("returns the natural measured height when it fits within the viewport", () => {
    const measuredPanelHeight = 300;
    const expectedNatural = measuredPanelHeight + PANEL_BODY_VERTICAL_PADDING;

    const { targetPanelHeight, targetPanelNeedsScroll } = getTargetPanelMetrics({
      viewportHeight: 900,
      measuredPanelHeight,
    });

    expect(targetPanelHeight).toBe(expectedNatural);
    expect(targetPanelNeedsScroll).toBe(false);
  });

  it("does not set panelNeedsScroll when height fits exactly at the max", () => {
    // Make measuredNaturalPanelHeight equal exactly to maxPanelHeight
    const viewportHeight = 900;
    const maxPanelHeight = Math.max(PANEL_MIN_HEIGHT, viewportHeight - OVERHEAD);
    const measuredPanelHeight = maxPanelHeight - PANEL_BODY_VERTICAL_PADDING;

    const { targetPanelHeight, targetPanelNeedsScroll } = getTargetPanelMetrics({
      viewportHeight,
      measuredPanelHeight,
    });

    expect(targetPanelHeight).toBe(maxPanelHeight);
    expect(targetPanelNeedsScroll).toBe(false);
  });
});

describe("getNextCommittedPanelMetrics", () => {
  it("returns the same object reference when nothing has changed (identity)", () => {
    const previous = { key: "suite-a", panelHeight: 200, panelNeedsScroll: false };
    const result = getNextCommittedPanelMetrics({
      previous,
      panelMeasurementKey: "suite-a",
      targetPanelHeight: 200,
      targetPanelNeedsScroll: false,
    });
    expect(result).toBe(previous);
  });

  it("returns a new object when the measurement key changes", () => {
    const previous = { key: "suite-a", panelHeight: 200, panelNeedsScroll: false };
    const result = getNextCommittedPanelMetrics({
      previous,
      panelMeasurementKey: "suite-b",
      targetPanelHeight: 200,
      targetPanelNeedsScroll: false,
    });
    expect(result).not.toBe(previous);
    expect(result.key).toBe("suite-b");
  });

  it("returns a new object when panel height changes", () => {
    const previous = { key: "suite-a", panelHeight: 200, panelNeedsScroll: false };
    const result = getNextCommittedPanelMetrics({
      previous,
      panelMeasurementKey: "suite-a",
      targetPanelHeight: 300,
      targetPanelNeedsScroll: false,
    });
    expect(result).not.toBe(previous);
    expect(result.panelHeight).toBe(300);
  });

  it("returns a new object when scroll status changes", () => {
    const previous = { key: "suite-a", panelHeight: 200, panelNeedsScroll: false };
    const result = getNextCommittedPanelMetrics({
      previous,
      panelMeasurementKey: "suite-a",
      targetPanelHeight: 200,
      targetPanelNeedsScroll: true,
    });
    expect(result).not.toBe(previous);
    expect(result.panelNeedsScroll).toBe(true);
  });

  it("initialises from INITIAL_COMMITTED_PANEL_METRICS as a valid previous object", () => {
    const result = getNextCommittedPanelMetrics({
      previous: INITIAL_COMMITTED_PANEL_METRICS,
      panelMeasurementKey: "suite-a",
      targetPanelHeight: 150,
      targetPanelNeedsScroll: false,
    });
    expect(result.key).toBe("suite-a");
    expect(result.panelHeight).toBe(150);
  });
});
