import { Database, Github, Globe, House, LayoutGrid, TrainTrack } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { cn } from "@/app/lib/utils";

type SiteIconProps = {
  className?: string;
};

const LogoIcon = ({ className }: SiteIconProps) => (
  <img
    src="/logo.png"
    alt=""
    aria-hidden="true"
    className={cn("size-4 object-contain", className)}
  />
);

export const SITE_ICONS = {
  logo: LogoIcon,
  home: ({ className }: SiteIconProps) => <House className={className} aria-hidden="true" />,
  railyard: ({ className }: SiteIconProps) => (
    <TrainTrack className={className} aria-hidden="true" />
  ),
  registry: ({ className }: SiteIconProps) => <Database className={className} aria-hidden="true" />,
  "template-mod": ({ className }: SiteIconProps) => (
    <LayoutGrid className={className} aria-hidden="true" />
  ),
  website: ({ className }: SiteIconProps) => <Globe className={className} aria-hidden="true" />,
  github: ({ className }: SiteIconProps) => <Github className={className} aria-hidden="true" />,
  discord: ({ className }: SiteIconProps) => (
    <FaDiscord className={cn("size-4", className)} aria-hidden="true" />
  ),
} as const;

export type SiteIconKey = keyof typeof SITE_ICONS;
