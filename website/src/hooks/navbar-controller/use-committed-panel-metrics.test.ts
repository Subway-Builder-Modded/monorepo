import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { INITIAL_COMMITTED_PANEL_METRICS } from "@/hooks/navbar-controller/constants";
import { useCommittedPanelMetrics } from "@/hooks/navbar-controller/use-committed-panel-metrics";

const BASE_PROPS: Parameters<typeof useCommittedPanelMetrics>[0] = {
  hasMeasuredCurrentPanel: true,
  panelMeasurementKey: "key-a",
  phase: "open",
  targetPanelHeight: 300,
  targetPanelNeedsScroll: false,
};

describe("useCommittedPanelMetrics", () => {
  it("commits metrics when panel is measured and phase is open", () => {
    const { result } = renderHook(() => useCommittedPanelMetrics(BASE_PROPS));

    expect(result.current.key).toBe("key-a");
    expect(result.current.panelHeight).toBe(300);
    expect(result.current.panelNeedsScroll).toBe(false);
  });

  it("resets to initial metrics when phase changes to closed", () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCommittedPanelMetrics>[0]) => useCommittedPanelMetrics(props),
      { initialProps: BASE_PROPS },
    );

    expect(result.current.panelHeight).toBe(300);

    rerender({ ...BASE_PROPS, phase: "closed" });

    expect(result.current).toEqual(INITIAL_COMMITTED_PANEL_METRICS);
  });

  it("does not commit metrics when panel has not been measured yet", () => {
    const { result } = renderHook(() =>
      useCommittedPanelMetrics({ ...BASE_PROPS, hasMeasuredCurrentPanel: false }),
    );

    expect(result.current).toEqual(INITIAL_COMMITTED_PANEL_METRICS);
  });

  it("does not update when hasMeasuredCurrentPanel is false even if other props change", () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCommittedPanelMetrics>[0]) => useCommittedPanelMetrics(props),
      { initialProps: { ...BASE_PROPS, hasMeasuredCurrentPanel: false } },
    );

    rerender({ ...BASE_PROPS, hasMeasuredCurrentPanel: false, targetPanelHeight: 999 });

    expect(result.current).toEqual(INITIAL_COMMITTED_PANEL_METRICS);
  });

  it("updates committed metrics when target height changes", () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCommittedPanelMetrics>[0]) => useCommittedPanelMetrics(props),
      { initialProps: BASE_PROPS },
    );

    rerender({ ...BASE_PROPS, targetPanelHeight: 450, targetPanelNeedsScroll: true });

    expect(result.current.panelHeight).toBe(450);
    expect(result.current.panelNeedsScroll).toBe(true);
  });

  it("updates when the panel measurement key changes", () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCommittedPanelMetrics>[0]) => useCommittedPanelMetrics(props),
      { initialProps: BASE_PROPS },
    );

    rerender({ ...BASE_PROPS, panelMeasurementKey: "key-b" });

    expect(result.current.key).toBe("key-b");
  });

  it("begins unmeasured and then commits once measured", () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useCommittedPanelMetrics>[0]) => useCommittedPanelMetrics(props),
      { initialProps: { ...BASE_PROPS, hasMeasuredCurrentPanel: false } },
    );

    expect(result.current).toEqual(INITIAL_COMMITTED_PANEL_METRICS);

    act(() => {
      rerender({ ...BASE_PROPS, hasMeasuredCurrentPanel: true });
    });

    expect(result.current.panelHeight).toBe(300);
    expect(result.current.key).toBe("key-a");
  });
});
