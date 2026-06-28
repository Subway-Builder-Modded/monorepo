import {
  BookText,
  ChartLine,
  Compass,
  Database,
  Download,
  GitPullRequestArrow,
  Globe,
  Heart,
  Home,
  Megaphone,
  Package,
  TrainTrack,
  Users,
  Warehouse,
} from "lucide-react";
import { DiscordIcon, GithubIcon } from "@subway-builder-modded/icons";

export const HOME_ICONS = {
  bookText: BookText,
  chartLine: ChartLine,
  compass: Compass,
  database: Database,
  discord: DiscordIcon,
  download: Download,
  github: GithubIcon,
  gitPullRequestArrow: GitPullRequestArrow,
  globe: Globe,
  heart: Heart,
  home: Home,
  package: Package,
  trainTrack: TrainTrack,
  users: Users,
  warehouse: Warehouse,
  megaphone: Megaphone,
} as const;

export type HomeIconName = keyof typeof HOME_ICONS;

export function getHomeIcon(iconName: HomeIconName) {
  return HOME_ICONS[iconName];
}
