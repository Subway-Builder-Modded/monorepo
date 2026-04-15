import { ShellFooter } from "@subway-builder-modded/shared-ui";
import { SITE_COMMUNITY_LINKS, SITE_SUITES, getItemsForSuite } from "@/app/config/site-navigation";

const SUITE_COLUMN_TITLES: Record<string, string> = {
  general: "General",
  railyard: "Railyard",
  registry: "Registry",
  "template-mod": "Template Mod",
  website: "Website",
};

export function SiteFooter() {
  const year = new Date().getFullYear();

  const columns = SITE_SUITES.map((suite) => ({
    id: suite.id,
    title: SUITE_COLUMN_TITLES[suite.id] ?? suite.title,
    accentColor: `color-mix(in srgb, ${suite.accent.dark} 62%, ${suite.accent.light})`,
    links: getItemsForSuite(suite.id).map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      icon: item.icon,
      accentLight: suite.accent.light,
      accentDark: suite.accent.dark,
      mutedLight: suite.accent.mutedLight,
      mutedDark: suite.accent.mutedDark,
    })),
  }));

  const externalLinks = SITE_COMMUNITY_LINKS;

  return (
    <ShellFooter
      brand={{
        href: "/",
        logoSrc: "/logo.png",
        title: "Subway Builder Modded",
        description:
          "A unified transit-grade hub for Subway Builder Modded suites and community services.",
      }}
      columns={columns}
      externalLinks={externalLinks}
      copyright={`© ${year} Subway Builder Modded.`}
      secondaryText="Built with the community."
    />
  );
}
