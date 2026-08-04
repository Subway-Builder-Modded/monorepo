import type { ChartMargin } from "./chart-types";

export const DEFAULT_CHART_MARGIN: ChartMargin = {
  top: 8,
  right: 20,
  bottom: 0,
  left: 8,
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
    // "Start at zero" pins zero inside the domain; negative values (e.g. the
    // deprecations series below the axis) extend it downward with nice steps.
    const upper = Math.max(dataMax, 0);
    const lower = Math.min(dataMin, 0);
    if (upper <= 0 && lower >= 0) return fallback;
    const step = niceStep((upper - lower) / (tickCount - 1));
    const niceMax = Math.ceil(upper / step) * step;
    const niceMin = Math.floor(lower / step) * step;
    const ticks: number[] = [];
    for (let t = niceMin; t <= niceMax; t += step) ticks.push(t);
    return { domain: [niceMin, niceMax], ticks };
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
  if (maxTickCount <= 1) return [values[0]];

  const lastIndex = values.length - 1;
  const maxNiceTickCount = maxTickCount + 1;
  let interval = 1;

  for (let magnitude = 1; interval <= lastIndex; magnitude *= 10) {
    const candidates = [1, 2, 5].map((step) => step * magnitude);
    const match = candidates.find((step) => {
      const cadenceTickCount = Math.floor(lastIndex / step) + 1;
      const needsInitialTick = lastIndex % step !== 0;
      return cadenceTickCount + (needsInitialTick ? 1 : 0) <= maxNiceTickCount;
    });

    if (match) {
      interval = match;
      break;
    }
  }

  const ticks: T[] = [values[0]];
  const cadenceStart = lastIndex % interval;
  const shouldCombineShortInitialInterval = cadenceStart > 0 && cadenceStart < interval / 2;
  const firstCadenceIndex =
    cadenceStart === 0
      ? interval
      : shouldCombineShortInitialInterval
        ? cadenceStart + interval
        : cadenceStart;
  for (let index = firstCadenceIndex; index <= lastIndex; index += interval) {
    ticks.push(values[index]);
  }

  return ticks;
}

// Horizontal budget per x-label ("Jun 30" at 11px plus breathing room) and the
// non-plot width a chart spends on its y-axis + margins.
const X_TICK_MIN_PX = 52;
const X_AXIS_RESERVED_PX = 72;

/**
 * X-axis ticks that fit the measured container width. Candidates are thinned
 * (via createCategoryTicks) to what the plot area can hold, so labels never
 * crush on narrow viewports. `cap` bounds wide-screen tick counts for
 * auto-derived candidates; explicit caller ticks pass no cap and keep their
 * density wherever it fits. An unmeasured width (0 — first paint, jsdom)
 * preserves the unthinned behavior.
 */
export function createFittedCategoryTicks<T>(
  candidates: T[],
  containerWidth: number,
  { cap }: { cap?: number } = {},
): T[] {
  if (containerWidth <= 0) {
    return cap === undefined ? candidates : createCategoryTicks(candidates, cap);
  }
  const fit = Math.max(2, Math.floor((containerWidth - X_AXIS_RESERVED_PX) / X_TICK_MIN_PX));
  return createCategoryTicks(candidates, cap === undefined ? fit : Math.min(cap, fit));
}

export function formatXAxisLabel(value: string | number): string {
  if (typeof value !== "string") return String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }
  return value;
}
