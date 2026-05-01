export type MultiSeriesPoint = Record<string, string | number>;

export type LineConfig = {
  key: string;
  name: string;
  color?: string;
};

export type BarConfig = {
  key: string;
  name: string;
  color?: string;
  stackId?: string;
};

export type ChartMargin = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};
