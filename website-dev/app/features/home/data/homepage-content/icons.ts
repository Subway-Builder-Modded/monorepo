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
  Package,
  TrainTrack,
  Users,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";

export const HOME_ICONS = {
  bookText: BookText,
  chartLine: ChartLine,
  compass: Compass,
  database: Database,
  discord: FaDiscord,
  download: Download,
  gitPullRequestArrow: GitPullRequestArrow,
  globe: Globe,
  heart: Heart,
  home: Home,
  package: Package,
  trainTrack: TrainTrack,
  users: Users,
} as const;

export type HomeIconName = keyof typeof HOME_ICONS;

export function getHomeIcon(iconName: HomeIconName) {
  return HOME_ICONS[iconName];
}
