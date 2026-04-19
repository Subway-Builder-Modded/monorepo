import type { ComponentType } from "react";
import {
  BookText,
  ChartLine,
  Compass,
  Database,
  Download,
  GitPullRequestArrow,
  Globe,
  Home,
  Package,
  TrainTrack,
  TrendingUp,
} from "lucide-react";

export type SuiteStep = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  icon: ComponentType<{ className?: string }>;
  accent: { light: string; dark: string };
  imageLight: string;
  imageDark: string;
  imageAlt: string;
  primaryAction: { label: string; href: string; icon: ComponentType<{ className?: string }> };
  secondaryAction: {
    label: string;
    href: string;
    external?: boolean;
    icon: ComponentType<{ className?: string }>;
  };
};

export const SUITE_STEPS: SuiteStep[] = [
  {
    id: "railyard",
    title: "Railyard",
    description: "The all-in-one manager for Subway Builder community-made content.",
    bullets: [
      "Download, manage, and update community-made maps and mods.",
      "Browse the full registry of user-published content.",
      "Fully customizable, exactly how you want it to be.",
    ],
    icon: TrainTrack,
    accent: { light: "#0f8f68", dark: "#19d89c" },
    imageLight: "/images/railyard/hero-light.png",
    imageDark: "/images/railyard/hero-dark.png",
    imageAlt: "Railyard application interface",
    primaryAction: { label: "Download App", href: "/railyard", icon: Download },
    secondaryAction: { label: "Browse Content", href: "/railyard/browse", icon: Compass },
  },
  {
    id: "registry",
    title: "Registry",
    description: "The GitHub-hosted registry powering Railyard and its services.",
    bullets: [
      "Hosts an index of all user-published content.",
      "Contains full analytics for all Subway Builder Modded projects.",
      "Completely automated and powered by GitHub Actions."
    ],
    icon: Database,
    accent: { light: "#9d4edd", dark: "#c77dff" },
    imageLight: "/images/registry/hero-light.png",
    imageDark: "/images/registry/hero-dark.png",
    imageAlt: "Registry analytics dashboard",
    primaryAction: { label: "Analytics", href: "/registry/analytics", icon: ChartLine },
    secondaryAction: {
      label: "World Map",
      href: "/registry/world-map",
      icon: Globe,
    },
  },
  {
    id: "template-mod",
    title: "Template Mod",
    description:
      "The all-inclusive TypeScript template for creating Subway Builder mods.",
    bullets: [
      "Pre-configured project scaffold with build tooling ready to go.",
      "Full documentation for getting started and publishing.",
      "Built and maintained by the community to be aligned with the Subway Builder modding API.",
    ],
    icon: Package,
    accent: { light: "#60a5fa", dark: "#93c5fd" },
    imageLight: "/images/template-mod/hero-light.png",
    imageDark: "/images/template-mod/hero-dark.png",
    imageAlt: "Template Mod project structure",
    primaryAction: { label: "Home", href: "/template-mod", icon: Home },
    secondaryAction: { label: "Documentation", href: "/template-mod/docs", icon: BookText },
  },
  {
    id: "website",
    title: "Website",
    description:
      "Central place for docs, analytics, and community resources for all Subway Builder Modded projects.",
    bullets: [
      "Visualize analytics for every project in the ecosystem.",
      "View project changelogs, documentation, and roadmaps.",
      "Interactive, responsive, and built for ease of use.",
    ],
    icon: Globe,
    accent: { light: "#f2992e", dark: "#ffbe73" },
    imageLight: "/images/website/hero-light.png",
    imageDark: "/images/website/hero-dark.png",
    imageAlt: "Website homepage",
    primaryAction: { label: "Analytics", href: "/website/analytics", icon: ChartLine },
    secondaryAction: {
      label: "Contribute",
      href: "https://github.com/Subway-Builder-Modded/website",
      external: true,
      icon: GitPullRequestArrow,
    },
  },
];

export type AnalyticsLink = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  accent: { light: string; dark: string };
};

export const ANALYTICS_LINKS: AnalyticsLink[] = [
  {
    label: "Railyard",
    href: "/railyard/analytics",
    icon: ChartLine,
    accent: { light: "#0f8f68", dark: "#19d89c" },
  },
  {
    label: "Registry",
    href: "/registry/analytics",
    icon: ChartLine,
    accent: { light: "#9d4edd", dark: "#c77dff" },
  },
  {
    label: "Website",
    href: "/website/analytics",
    icon: ChartLine,
    accent: { light: "#f2992e", dark: "#ffbe73" },
  },
];

export const HERO_SUITE_BARS = [
  { light: "#0f8f68", dark: "#19d89c" },
  { light: "#9d4edd", dark: "#c77dff" },
  { light: "#60a5fa", dark: "#93c5fd" },
  { light: "#f2992e", dark: "#ffbe73" },
  { light: "#d64545", dark: "#ff6b6b" },
] as const;
