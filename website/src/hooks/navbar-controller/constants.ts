export const TOP_BAR_HEIGHT = 48;
export const NAVBAR_TOP_OFFSET = 16;
export const PANEL_MIN_HEIGHT = 84;
export const PANEL_BODY_VERTICAL_PADDING = 20;
export const PANEL_VIEWPORT_BOTTOM_GUTTER = 24;

export type CommittedPanelMetrics = {
  key: string | null;
  panelHeight: number;
  panelNeedsScroll: boolean;
};

export const INITIAL_COMMITTED_PANEL_METRICS: CommittedPanelMetrics = {
  key: null,
  panelHeight: PANEL_MIN_HEIGHT,
  panelNeedsScroll: false,
};
