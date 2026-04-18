import { AppFooter } from "@subway-builder-modded/shared-ui";
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
    links: getItemsForSuite(suite.id).map((item) => {
      const ItemIcon = item.icon;

      return {
        id: item.id,
        title: item.title,
        href: item.href,
        icon: <ItemIcon className="size-4" aria-hidden={true} />,
        accentLight: suite.accent.light,
        accentDark: suite.accent.dark,
        mutedLight: suite.accent.mutedLight,
        mutedDark: suite.accent.mutedDark,
      };
    }),
  }));

  const externalLinks = SITE_COMMUNITY_LINKS;

  return (
    <AppFooter
      brand={{
        href: "/",
        logoSrc: "/logo.svg",
        title: "Subway Builder Modded",
        description: "The complete hub for everything modded in Subway Builder.",
      }}
      columns={columns}
      externalLinks={externalLinks}
      copyright={`© ${year} Subway Builder Modded. Not affiliated with Subway Builder or Redistricter, LLC.`}
      secondaryText="All content is community-created and shared under appropriate licenses."
    />
  );
}
