import { SITE_ICONS, type SiteIconKey } from "@/app/config/site-icons";

type SiteIconProps = {
  iconKey: SiteIconKey;
  className?: string;
};

export function SiteIcon({ iconKey, className }: SiteIconProps) {
  const Icon = SITE_ICONS[iconKey];
  return <Icon className={className} />;
}
