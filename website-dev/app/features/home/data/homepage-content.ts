import type { ComponentType } from "react";
import {
  BookText,
  ChartLine,
  Compass,
  Database,
  Download,
  FolderGit2,
  GitPullRequestArrow,
  Globe,
  Package,
  TrainTrack,
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
    primaryAction: { label: "Railyard", href: "/railyard", icon: Download },
    secondaryAction: { label: "Browse Content", href: "/railyard/browse", icon: Compass },
  },
  {
    id: "registry",
    title: "Registry",
    description: "The GitHub-hosted registry powering Railyard and its services.",
    bullets: [
      "Hosts every published map, mod, and content package.",
      "Full analytics and trending insights for all registered content.",
    ],
    icon: Database,
    accent: { light: "#9d4edd", dark: "#c77dff" },
    imageLight: "/images/shared/registry-light.png",
    imageDark: "/images/shared/registry-dark.png",
    imageAlt: "Registry analytics dashboard",
    primaryAction: { label: "Registry", href: "/registry", icon: Database },
    secondaryAction: {
      label: "View on GitHub",
      href: "https://github.com/Subway-Builder-Modded/registry",
      external: true,
      icon: FolderGit2,
    },
  },
  {
    id: "template-mod",
    title: "Template Mod",
    description:
      "The all-inclusive TypeScript template to create your own mods for Subway Builder.",
    bullets: [
      "Pre-configured project scaffold with build tooling ready to go.",
      "Full documentation for getting started and publishing.",
    ],
    icon: Package,
    accent: { light: "#60a5fa", dark: "#93c5fd" },
    imageLight: "/images/shared/template-mod-light.png",
    imageDark: "/images/shared/template-mod-dark.png",
    imageAlt: "Template Mod project structure",
    primaryAction: { label: "Template Mod", href: "/template-mod", icon: Package },
    secondaryAction: { label: "Documentation", href: "/template-mod/docs", icon: BookText },
  },
  {
    id: "website",
    title: "Website",
    description:
      "Central place for docs, analytics, and community resources across all Subway Builder Modded projects.",
    bullets: [
      "Aggregated analytics for every project in the ecosystem.",
      "Changelogs, release notes, and ecosystem documentation.",
    ],
    icon: Globe,
    accent: { light: "#f2992e", dark: "#ffbe73" },
    imageLight: "/images/shared/website-light.png",
    imageDark: "/images/shared/website-dark.png",
    imageAlt: "Website homepage",
    primaryAction: { label: "Website", href: "/website", icon: Globe },
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
