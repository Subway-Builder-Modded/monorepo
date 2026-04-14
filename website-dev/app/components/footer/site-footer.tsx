import { ShellFooter } from "@subway-builder-modded/shared-ui";
import { SITE_COMMUNITY_LINKS, SITE_FOOTER_INTERNAL_GROUP } from "@/app/lib/site-navigation";
import { SiteIcon } from "@/app/components/navigation/site-icon";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <ShellFooter
      brand={{
        icon: <SiteIcon iconKey="logo" className="size-6" />,
        title: "Subway Builder Modded",
        description: "A unified hub for Subway Builder Modded suites and community services.",
      }}
      groups={[SITE_FOOTER_INTERNAL_GROUP]}
      externalLinks={SITE_COMMUNITY_LINKS.map((link) => ({
        id: link.id,
        title: link.title,
        href: link.href,
      }))}
      copyright={`© ${year} Subway Builder Modded.`}
      secondaryText="Built with the community."
    />
  );
}
