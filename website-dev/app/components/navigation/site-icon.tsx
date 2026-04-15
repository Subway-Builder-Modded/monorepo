import type { SiteIconKey } from "@subway-builder-modded/config";
import { Circle, Database, Github, Globe, LayoutGrid, TrainTrack, Waypoints } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { cn } from "@/app/lib/utils";

type SiteIconProps = {
  iconKey: SiteIconKey;
  className?: string;
};

export function SiteIcon({ iconKey, className }: SiteIconProps) {
  switch (iconKey) {
    case "logo":
      return (
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className={cn("size-4 object-contain", className)}
        />
      );
    case "railyard":
      return <TrainTrack className={className} aria-hidden="true" />;
    case "registry":
      return <Database className={className} aria-hidden="true" />;
    case "template-mod":
      return <LayoutGrid className={className} aria-hidden="true" />;
    case "website":
      return <Globe className={className} aria-hidden="true" />;
    case "github":
      return <Github className={className} aria-hidden="true" />;
    case "discord":
      return <FaDiscord className={cn("size-4", className)} aria-hidden="true" />;
    case "overview":
      return <Waypoints className={className} aria-hidden="true" />;
    default:
      return <Circle className={className} aria-hidden="true" />;
  }
}
