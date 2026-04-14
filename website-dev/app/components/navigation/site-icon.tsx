import type { WebsiteDevIconKey } from "@subway-builder-modded/config";
import {
  ChartNoAxesCombined,
  Circle,
  Component,
  Compass,
  Database,
  Github,
  Globe,
  LayoutGrid,
  PanelsTopLeft,
  TrainTrack,
  Waypoints,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { cn } from "@/app/lib/utils";

type SiteIconProps = {
  iconKey: WebsiteDevIconKey;
  className?: string;
};

function SiteLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className={cn("size-4", className)} fill="none">
      <path
        d="M22.58 251.72V168.1A145.53 145.53 0 0 1 168.1 22.58h83.62"
        stroke="#d82233"
        strokeWidth="39.58"
        strokeLinecap="round"
      />
      <path
        d="M67.8 251.72V168.1A100.3 100.3 0 0 1 168.1 67.8h83.62"
        stroke="#009952"
        strokeWidth="39.58"
        strokeLinecap="round"
      />
      <path
        d="M111.36 251.72V168.1A56.74 56.74 0 0 1 168.1 111.36h83.62"
        stroke="#0062cf"
        strokeWidth="39.58"
        strokeLinecap="round"
      />
      <circle cx="171.1" cy="22.58" r="15.44" fill="#ffffff" />
      <circle cx="171.1" cy="67.8" r="15.44" fill="#ffffff" />
      <circle cx="171.1" cy="111.36" r="15.44" fill="#ffffff" />
    </svg>
  );
}

export function SiteIcon({ iconKey, className }: SiteIconProps) {
  switch (iconKey) {
    case "logo":
      return <SiteLogo className={className} />;
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
    case "browse":
      return <Compass className={className} aria-hidden="true" />;
    case "directory":
      return <PanelsTopLeft className={className} aria-hidden="true" />;
    case "blueprint":
      return <Component className={className} aria-hidden="true" />;
    case "metrics":
      return <ChartNoAxesCombined className={className} aria-hidden="true" />;
    default:
      return <Circle className={className} aria-hidden="true" />;
  }
}
