import type { ChartMargin } from "./chart-types";

export const DEFAULT_CHART_MARGIN: ChartMargin = {
  top: 8,
  right: 8,
  bottom: 0,
  left: 0,
};

export const CHART_GRID_STROKE = "currentColor";
export const CHART_AXIS_TICK_COLOR = "currentColor";
export const CHART_AXIS_LINE_COLOR = "currentColor";
export const CHART_LEGEND_TEXT_COLOR = "hsl(var(--foreground))";
export const CHART_FONT_SIZE = 11;

export function formatYAxisTick(value: string | number): string {
  if (typeof value !== "number") return String(value);
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function createNumericDomain(values: number[]): [number, number] | ["auto", "auto"] {
  if (values.length === 0) return ["auto", "auto"];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (!Number.isFinite(min) || !Number.isFinite(max)) return ["auto", "auto"];
  if (min === max) {
    const pad = Math.max(1, Math.round(Math.abs(max) * 0.05));
    return [min - pad, max + pad];
  }

  const span = max - min;
  const pad = Math.max(1, Math.round(span * 0.08));
  const lower = Math.max(0, min - pad);
  const upper = max + pad;

  return [lower, upper];
}

function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

export function createLineChartTicks(
  values: number[],
  { startAtZero = false, tickCount = 7 }: { startAtZero?: boolean; tickCount?: number } = {},
): { domain: [number, number]; ticks: number[] } {
  const fallback = { domain: [0, 10] as [number, number], ticks: [0, 2, 4, 6, 8, 10] };
  if (values.length === 0) return fallback;
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return fallback;

  if (startAtZero) {
    if (dataMax <= 0) return fallback;
    const step = niceStep(dataMax / (tickCount - 1));
    const niceMax = Math.ceil(dataMax / step) * step;
    const ticks: number[] = [];
    for (let t = 0; t <= niceMax; t += step) ticks.push(t);
    return { domain: [0, niceMax], ticks };
  }

  // Fit to data: pick a nice step from the span, floor min and ceil max to that step.
  const span = dataMax - dataMin;
  const step = niceStep(span / (tickCount - 1));
  const niceMin = Math.floor(dataMin / step) * step;
  const niceMax = Math.ceil(dataMax / step) * step;
  const ticks: number[] = [];
  for (let t = niceMin; t <= niceMax; t += step) ticks.push(t);
  return { domain: [niceMin, niceMax], ticks };
}

export function createCategoryTicks<T>(values: T[], maxTickCount = 8): T[] {
  if (values.length <= maxTickCount) return values;

  const step = Math.ceil((values.length - 1) / (maxTickCount - 1));
  const ticks: T[] = [];
  for (let index = 0; index < values.length; index += step) {
    ticks.push(values[index]);
  }

  const lastValue = values[values.length - 1];
  if (ticks[ticks.length - 1] !== lastValue) {
    ticks.push(lastValue);
  }

  return ticks;
}

export function formatXAxisLabel(value: string | number): string {
  if (typeof value !== "string") return String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }
  return value;
}
