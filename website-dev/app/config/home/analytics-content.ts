import type { AnalyticsLink, AnalyticsPreviewSeries } from "./types";

export const ANALYTICS_SECTION = {
  title: "In-depth analytics and insights",
  description: "Download counts, recent trends, and community-content analytics for every project.",
  body: "Visualize detailed analytics for every project in the ecosystem, from Registry map download trends to per-page website traffic.",
} as const;

export const ANALYTICS_PREVIEW = {
  title: "analytics - downloads",
  yLabels: ["8k", "6k", "4k", "2k", "0"],
  xLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  series: [
    {
      label: "Maps",
      color: "#1c7ed6",
      points: "40,150 112,135 184,115 256,100 328,82 400,65 470,48",
    },
    {
      label: "Mods",
      color: "#e03131",
      points: "40,165 112,155 184,140 256,132 328,120 400,110 470,100",
    },
  ] as AnalyticsPreviewSeries[],
} as const;

export const ANALYTICS_LINKS: AnalyticsLink[] = [
  {
    label: "Railyard App Analytics",
    href: "/railyard/analytics",
    icon: "trainTrack",
    accentSuiteId: "railyard",
  },
  {
    label: "Registry Content Analytics",
    href: "/registry/analytics",
    icon: "database",
    accentSuiteId: "registry",
  },
  {
    label: "Website Traffic Analytics",
    href: "/website/analytics",
    icon: "globe",
    accentSuiteId: "website",
  },
];
