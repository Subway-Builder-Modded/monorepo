import {
  NAVBAR_TOP_OFFSET,
  PANEL_BODY_VERTICAL_PADDING,
  PANEL_MIN_HEIGHT,
  PANEL_VIEWPORT_BOTTOM_GUTTER,
  TOP_BAR_HEIGHT,
  type CommittedPanelMetrics,
} from "./constants";

type PanelMetricsInputs = {
  viewportHeight: number;
  measuredPanelHeight: number;
};

type NextCommittedPanelMetricsInputs = {
  previous: CommittedPanelMetrics;
  panelMeasurementKey: string;
  targetPanelHeight: number;
  targetPanelNeedsScroll: boolean;
};

export function getTargetPanelMetrics({ viewportHeight, measuredPanelHeight }: PanelMetricsInputs) {
  const maxPanelHeight = Math.max(
    PANEL_MIN_HEIGHT,
    viewportHeight - NAVBAR_TOP_OFFSET - TOP_BAR_HEIGHT - PANEL_VIEWPORT_BOTTOM_GUTTER,
  );
  const measuredNaturalPanelHeight = Math.max(
    PANEL_MIN_HEIGHT,
    measuredPanelHeight + PANEL_BODY_VERTICAL_PADDING,
  );

  return {
    targetPanelHeight: Math.min(measuredNaturalPanelHeight, maxPanelHeight),
    targetPanelNeedsScroll: measuredNaturalPanelHeight > maxPanelHeight,
  };
}

export function getNextCommittedPanelMetrics({
  previous,
  panelMeasurementKey,
  targetPanelHeight,
  targetPanelNeedsScroll,
}: NextCommittedPanelMetricsInputs): CommittedPanelMetrics {
  if (
    previous.key === panelMeasurementKey &&
    previous.panelHeight === targetPanelHeight &&
    previous.panelNeedsScroll === targetPanelNeedsScroll
  ) {
    return previous;
  }

  return {
    key: panelMeasurementKey,
    panelHeight: targetPanelHeight,
    panelNeedsScroll: targetPanelNeedsScroll,
  };
}
