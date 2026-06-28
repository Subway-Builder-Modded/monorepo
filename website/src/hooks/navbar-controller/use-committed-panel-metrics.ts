import { useEffect, useState } from "react";
import { INITIAL_COMMITTED_PANEL_METRICS, type CommittedPanelMetrics } from "./constants";
import { getNextCommittedPanelMetrics } from "./panel-metrics";

type UseCommittedPanelMetricsOptions = {
  hasMeasuredCurrentPanel: boolean;
  panelMeasurementKey: string;
  phase: "closed" | "opening" | "open" | "closing";
  targetPanelHeight: number;
  targetPanelNeedsScroll: boolean;
};

export function useCommittedPanelMetrics({
  hasMeasuredCurrentPanel,
  panelMeasurementKey,
  phase,
  targetPanelHeight,
  targetPanelNeedsScroll,
}: UseCommittedPanelMetricsOptions): CommittedPanelMetrics {
  const [committedPanelMetrics, setCommittedPanelMetrics] = useState(
    INITIAL_COMMITTED_PANEL_METRICS,
  );

  useEffect(() => {
    if (phase === "closed") {
      setCommittedPanelMetrics(INITIAL_COMMITTED_PANEL_METRICS);
      return;
    }

    if (!hasMeasuredCurrentPanel) {
      return;
    }

    setCommittedPanelMetrics((previousMetrics) =>
      getNextCommittedPanelMetrics({
        previous: previousMetrics,
        panelMeasurementKey,
        targetPanelHeight,
        targetPanelNeedsScroll,
      }),
    );
  }, [
    hasMeasuredCurrentPanel,
    panelMeasurementKey,
    phase,
    targetPanelHeight,
    targetPanelNeedsScroll,
  ]);

  return committedPanelMetrics;
}
