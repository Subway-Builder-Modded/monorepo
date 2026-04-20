export const OPEN_SOURCE_SECTION = {
  title: "Open-source and transparent",
  description:
    "Every project is public, every decision transparent. Explore the code or contribute directly.",
  body: "All Subway Builder Modded projects are fully open-source and developed on GitHub. Check out the code, follow along with development, or contribute directly to help shape the future of modding for Subway Builder.",
  cta: {
    label: "View on GitHub",
    href: "https://github.com/Subway-Builder-Modded",
  },
  codeSample: {
    content: `export const SUITE_PROJECTS = [
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
] as const;`,
    lang: "typescript",
    title: "suite-projects.ts",
  },
} as const;
