import type { SuiteStep } from "./types";

export const SUITE_SCROLLYTELLING_SECTION = {
  title: "The Subway Builder Modded ecosystem",
  description:
    "The complete suite of tools, resources, and projects for modding in Subway Builder, built and maintained by the community.",
} as const;

const TEMPLATE_MOD_CODE = `const {
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
    accentSuiteId: "railyard",
    title: "Railyard",
    description: "The all-in-one manager for Subway Builder community-made content.",
    bullets: [
      "Download, manage, and update community-made maps and mods.",
      "Browse the full registry of user-published content.",
      "Fully customizable, exactly how you want it to be.",
    ],
    icon: "trainTrack",
    media: {
      kind: "image",
      imageLight: "/images/railyard/hero-light.png",
      imageDark: "/images/railyard/hero-dark.png",
      imageAlt: "Railyard application interface",
    },
    primaryAction: { label: "Download App", href: "/railyard", icon: "download" },
    secondaryAction: { label: "Browse Content", href: "/railyard/browse", icon: "compass" },
  },
  {
    id: "registry",
    accentSuiteId: "registry",
    title: "Registry",
    description: "The GitHub-hosted registry powering Railyard and its services.",
    bullets: [
      "Hosts an index of all user-published content.",
      "Contains full analytics for all Subway Builder Modded projects.",
      "Completely automated and powered by GitHub Actions.",
    ],
    icon: "database",
    media: {
      kind: "image",
      imageLight: "/images/registry/hero-light.png",
      imageDark: "/images/registry/hero-dark.png",
      imageAlt: "Registry analytics dashboard",
    },
    primaryAction: { label: "Analytics", href: "/registry/analytics", icon: "chartLine" },
    secondaryAction: { label: "World Map", href: "/registry/world-map", icon: "globe" },
  },
  {
    id: "template-mod",
    accentSuiteId: "template-mod",
    title: "Template Mod",
    description: "The all-inclusive TypeScript template for creating Subway Builder mods.",
    bullets: [
      "Pre-configured project scaffold with build tooling ready to go.",
      "Full documentation for getting started and publishing.",
      "Built and maintained by the community to be aligned with the Subway Builder modding API.",
    ],
    icon: "package",
    media: {
      kind: "code",
      code: {
        content: TEMPLATE_MOD_CODE,
        lang: "tsx",
        fileName: "ridership-chart.tsx",
      },
    },
    primaryAction: { label: "Home", href: "/template-mod", icon: "home" },
    secondaryAction: { label: "Documentation", href: "/template-mod/docs", icon: "bookText" },
  },
  {
    id: "website",
    accentSuiteId: "website",
    title: "Website",
    description:
      "Central place for docs, analytics, and community resources for all Subway Builder Modded projects.",
    bullets: [
      "Visualize analytics for every project in the ecosystem.",
      "View project changelogs, documentation, and roadmaps.",
      "Interactive, responsive, and built for ease of use.",
    ],
    icon: "globe",
    media: {
      kind: "image",
      imageLight: "/images/website/hero-light.png",
      imageDark: "/images/website/hero-dark.png",
      imageAlt: "Website homepage",
    },
    primaryAction: { label: "Analytics", href: "/website/analytics", icon: "chartLine" },
    secondaryAction: {
      label: "Contribute",
      href: "https://github.com/Subway-Builder-Modded/website",
      external: true,
      icon: "gitPullRequestArrow",
    },
  },
];
