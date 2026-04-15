import { ShellFooter } from "@subway-builder-modded/shared-ui";
import { SITE_COMMUNITY_LINKS, SITE_SUITES } from "@/app/lib/site-navigation";
import { SiteIcon } from "@/app/components/navigation/site-icon";

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
    links: suite.items.map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      icon: <SiteIcon iconKey={item.iconKey} className="size-4" />,
      accentColor: suite.accent.light,
      mutedColor: suite.accent.mutedLight,
    })),
  }));

  const externalLinks = SITE_COMMUNITY_LINKS.filter(
    (link) => link.id === "discord" || link.id === "github",
  ).map((link) => ({
    id: link.id,
    title: link.title,
    href: link.href,
    icon: <SiteIcon iconKey={link.iconKey} className="size-4" />,
  }));

  return (
    <ShellFooter
      brand={{
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
