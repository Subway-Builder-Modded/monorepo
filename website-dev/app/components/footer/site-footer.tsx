import { ShellFooter } from "@subway-builder-modded/shared-ui";
import {
  WEBSITE_DEV_COMMUNITY_LINKS,
  WEBSITE_DEV_FOOTER_INTERNAL_GROUP,
  WEBSITE_DEV_FOOTER_SUITE_GROUP,
} from "@/app/lib/site-navigation";
import { SiteIcon } from "@/app/components/navigation/site-icon";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <ShellFooter
      brand={{
        icon: <SiteIcon iconKey="logo" className="size-6" />,
        title: "Subway Builder Modded",
        description:
          "Software-grade shell and wayfinding for the Subway Builder Modded suite ecosystem.",
      }}
      groups={[WEBSITE_DEV_FOOTER_SUITE_GROUP, WEBSITE_DEV_FOOTER_INTERNAL_GROUP]}
      externalLinks={WEBSITE_DEV_COMMUNITY_LINKS.map((link) => ({
        id: link.id,
        title: link.title,
        href: link.href,
      }))}
      copyright={`© ${year} Subway Builder Modded.`}
      secondaryText="Built with the community."
    />
  );
}
