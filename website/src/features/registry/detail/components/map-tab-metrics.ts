import { Briefcase, Building2, House, MapPin, Users } from "lucide-react";
import type { MetricId, ResolvedTheme } from "./map-tab-types";

export const METRIC_CONFIG: Record<
  MetricId,
  {
    label: string;
    shortLabel: string;
    unit?: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  residentCount: {
    label: "Population Density",
    shortLabel: "Population Density",
    icon: Users,
  },
  jobCount: {
    label: "Workplace Density",
    shortLabel: "Workplace Density",
    icon: Briefcase,
  },
  pointDensity: {
    label: "Demand Point Density",
    shortLabel: "Demand Point Density",
    icon: MapPin,
  },
  workToHomeCommuteDistance: {
    label: "Work → Home Commute Time",
    shortLabel: "Work → Home Commute Time",
    unit: "m",
    icon: House,
  },
  homeToWorkCommuteDistance: {
    label: "Home → Work Commute Time",
    shortLabel: "Home → Work Commute Time",
    unit: "m",
    icon: Building2,
  },
};

export const METRIC_SOURCE_KEYS: Record<MetricId, string> = {
  residentCount: "pop",
  jobCount: "jobs",
  pointDensity: "pointCount",
  workToHomeCommuteDistance: "workHomeCommuteMedian",
  homeToWorkCommuteDistance: "homeWorkCommuteMedian",
};

export const METRIC_ORDER: MetricId[] = [
  "residentCount",
  "jobCount",
  "pointDensity",
  "workToHomeCommuteDistance",
  "homeToWorkCommuteDistance",
];

export const HEAT_COLORS_BY_THEME: Record<ResolvedTheme, string[]> = {
  light: [
    "#e7f5ff",
    "#a5d8ff",
    "#74c0fc",
    "#4dabf7",
    "#339af0",
    "#1c7ed6",
    "#1756a9",
    "#0f2f5f",
    "#0a1220",
  ],
  dark: [
    "#0a1220",
    "#0f2f5f",
    "#1756a9",
    "#1c7ed6",
    "#339af0",
    "#4dabf7",
    "#74c0fc",
    "#a5d8ff",
    "#e7f5ff",
  ],
};

export function compactNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);
}

export function formatMetricValue(metricId: MetricId, value: number) {
  if (metricId === "residentCount" || metricId === "jobCount" || metricId === "pointDensity") {
    if (value >= 1000) return compactNumber(value);
    return Math.round(value).toLocaleString("en-US");
  }

  const unit = METRIC_CONFIG[metricId].unit;
  if (unit === "m") {
    const kilometers = value / 1000;
    const rounded = Number(kilometers >= 100 ? kilometers.toFixed(0) : kilometers.toFixed(1));
    return `${rounded} km`;
  }

  const formatted = value >= 1000 ? compactNumber(value) : value.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function readNumericProperty(properties: Record<string, unknown>, key: string): number {
  const raw = properties[key];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCoord(value: number | null) {
  if (!Number.isFinite(value ?? Number.NaN)) return "-";
  return Number(value).toFixed(4);
}
