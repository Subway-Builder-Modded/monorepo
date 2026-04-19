import type { ComponentType } from "react";
import {
  BookText,
  ChartLine,
  Compass,
  Database,
  Download,
  GitPullRequestArrow,
  Globe,
  Heart,
  Home,
  Package,
  TrainTrack,
  Users,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";

export type HeroSlideMod = {
  name: string;
  author: string;
  modId: string;
};

export type HeroSlide = {
  id: string;
  imageLight: string;
  imageDark: string;
  alt: string;
  mapName?: string;
  mapId?: string;
  creator?: string;
  saveFileCreator?: string;
  mods?: HeroSlideMod[];
  focalPointLight?: string;
  focalPointDark?: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "osaka",
    imageLight: "/images/home/osaka-light.png",
    imageDark: "/images/home/osaka-dark.png",
    alt: "Osaka",
    mapName: "Osaka",
    mapId: "yukina-osaka",
    creator: "Yukina-",
    saveFileCreator: "mygetaway",
    mods: [{ name: "Regions", author: "Yukina-", modId: "subwaybuilder-regions" }],
  },
  {
    id: "san-juan",
    imageLight: "/images/home/san-juan-light.png",
    imageDark: "/images/home/san-juan-dark.png",
    alt: "San Juan",
    mapName: "San Juan",
    mapId: "san-juan",
    creator: "slurry",
    saveFileCreator: "slurry",
    mods: [{ name: "Advanced Analytics", author: "Steno", modId: "advanced-analytics" }],
  },
];

export const HERO_AUTO_ROTATE_MS = 10_000;

export const HERO_TITLE_LINE_1 = "Subway Builder";
export const HERO_TITLE_LINE_2 = "Modded";
export const HERO_DESCRIPTION = "The complete hub for everything modded in Subway Builder.";

export const HERO_CTA_GITHUB = {
  label: "GitHub",
  href: "https://github.com/Subway-Builder-Modded",
} as const;

export const HERO_CTA_DISCORD = {
  label: "Discord",
  href: "https://discord.gg/syG9YHMyeG",
} as const;

export const HERO_CREDITS_TEXT = {
  buttonAriaLabel: "View image credits and map information",
  mapDetailsTitle: "Map Details",
  creatorLabel: "Creator",
  saveFileTitle: "Save File",
  modsTitle: "Mods",
} as const;

export const HERO_SUITE_BARS = [
  { light: "#0f8f68", dark: "#19d89c" },
  { light: "#9d4edd", dark: "#c77dff" },
  { light: "#60a5fa", dark: "#93c5fd" },
  { light: "#f2992e", dark: "#ffbe73" },
  { light: "#d64545", dark: "#ff6b6b" },
] as const;

export type PeopleDestination = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  label: string;
};

export const PEOPLE_DESTINATIONS: PeopleDestination[] = [
  {
    id: "community",
    icon: FaDiscord,
    title: "Community",
    description:
      "Get support, share feedback, show off your creations, and help shape the roadmap alongside other builders.",
    href: "/community",
    label: "Community Hub",
  },
  {
    id: "credits",
    icon: Users,
    title: "Credits",
    description: "The maintainers, collaborators, and contributors who keep us moving forward.",
    href: "/credits",
    label: "View Credits",
  },
  {
    id: "contribute",
    icon: Heart,
    title: "Contribute",
    description:
      "Support ongoing development and help ship new features faster while keeping everything free and open for everyone.",
    href: "/contribute",
    label: "Support the Project",
  },
];

export const PEOPLE_SECTION = {
  title: "Built by the community, for the community",
  description:
    "Run completely by the community, for the community. Join us in building the future of modding for Subway Builder.",
} as const;

export const OPEN_SOURCE_SECTION = {
  title: "Open-source and transparent",
  description:
    "Every project is public, every decision transparent. Explore the code or contribute directly.",
  body: "All Subway Builder Modded projects are fully open-source and developed on GitHub. Check out the code, follow along with development, or contribute directly to help shape the future of modding for Subway Builder.",
  cta: {
    label: "View on GitHub",
    href: "https://github.com/Subway-Builder-Modded",
  },
} as const;

export const OPEN_SOURCE_CODE = `export const SUITE_PROJECTS = [
  {
    id: "railyard",
    title: "Railyard",
    description: "All-in-one content manager",
    openSource: true,
  },
  {
    id: "registry",
    title: "Registry",
    description: "GitHub-hosted content registry",
    openSource: true,
  },
  {
    id: "template-mod",
    title: "Template Mod",
    description: "TypeScript mod scaffold",
    openSource: true,
  },
  {
    id: "website",
    title: "Website",
    description: "Central hub and docs",
    openSource: true,
  },
] as const;`;

export const ANALYTICS_SECTION = {
  title: "In-depth analytics and insights",
  description: "Download counts, recent trends, and community-content analytics for every project.",
  body: "Visualize detailed analytics for every project in the ecosystem, from Registry map download trends to per-page website traffic.",
} as const;

export type AnalyticsPreviewSeries = {
  label: string;
  color: string;
  points: string;
};

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

export type AnalyticsLink = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  accent: { light: string; dark: string };
};

export const ANALYTICS_LINKS: AnalyticsLink[] = [
  {
    label: "Railyard App Analytics",
    href: "/railyard/analytics",
    icon: TrainTrack,
    accent: { light: "#0f8f68", dark: "#19d89c" },
  },
  {
    label: "Registry Content Analytics",
    href: "/registry/analytics",
    icon: Database,
    accent: { light: "#9d4edd", dark: "#c77dff" },
  },
  {
    label: "Website Traffic Analytics",
    href: "/website/analytics",
    icon: Globe,
    accent: { light: "#f2992e", dark: "#ffbe73" },
  },
];

export const SUITE_SCROLLYTELLING_SECTION = {
  title: "The Subway Builder Modded ecosystem",
  description:
    "The complete suite of tools, resources, and projects for modding in Subway Builder, built and maintained by the community.",
} as const;

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
  mediaKind: "image" | "code";
  codeContent?: string;
  codeLang?: string;
  codeFileName?: string;
  primaryAction: { label: string; href: string; icon: ComponentType<{ className?: string }> };
  secondaryAction: {
    label: string;
    href: string;
    external?: boolean;
    icon: ComponentType<{ className?: string }>;
  };
};

export const TEMPLATE_MOD_CODE = `const {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} = api.utils.charts;

function RidershipChart() {
  const metrics = api.gameState.getLineMetrics();

  const data = metrics.map((m) => ({
    name: m.name,
    riders: m.ridersPerHour,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="riders" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}`;

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
    mediaKind: "image",
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
      "Completely automated and powered by GitHub Actions.",
    ],
    icon: Database,
    accent: { light: "#9d4edd", dark: "#c77dff" },
    imageLight: "/images/registry/hero-light.png",
    imageDark: "/images/registry/hero-dark.png",
    imageAlt: "Registry analytics dashboard",
    mediaKind: "image",
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
    description: "The all-inclusive TypeScript template for creating Subway Builder mods.",
    bullets: [
      "Pre-configured project scaffold with build tooling ready to go.",
      "Full documentation for getting started and publishing.",
      "Built and maintained by the community to be aligned with the Subway Builder modding API.",
    ],
    icon: Package,
    accent: { light: "#60a5fa", dark: "#93c5fd" },
    imageLight: "/images/template-mod/hero-light.png",
    imageDark: "/images/template-mod/hero-dark.png",
    imageAlt: "Template Mod code example",
    mediaKind: "code",
    codeContent: TEMPLATE_MOD_CODE,
    codeLang: "tsx",
    codeFileName: "ridership-chart.tsx",
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
    mediaKind: "image",
    primaryAction: { label: "Analytics", href: "/website/analytics", icon: ChartLine },
    secondaryAction: {
      label: "Contribute",
      href: "https://github.com/Subway-Builder-Modded/website",
      external: true,
      icon: GitPullRequestArrow,
    },
  },
];

export const CLOSING_BAND = {
  title: "Choose your route",
  description: "Start with the content manager, explore the registry, or dive into the source.",
  primaryCta: { label: "Get Railyard", href: "/railyard" },
  secondaryCta: { label: "Browse Content", href: "/railyard/browse" },
  githubCta: {
    label: "GitHub",
    href: "https://github.com/Subway-Builder-Modded",
  },
} as const;
