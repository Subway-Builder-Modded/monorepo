import type { NavIconKey } from '@subway-builder-modded/config';
import {
  ChartLine,
  Compass,
  Database,
  Download,
  FileCode2,
  FileSearchCorner,
  Globe,
  Heart,
  HeartHandshake,
  Home,
  Inbox,
  Megaphone,
  Moon,
  Package,
  Play,
  RefreshCw,
  Scale,
  Settings,
  Square,
  Sun,
  SunMoon,
  Terminal,
  TrainTrack,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import type { AppIconInput, AppIconValue } from '@/lib/icons';

const WEBSITE_NAV_ICON_BY_KEY: Partial<Record<NavIconKey, AppIconInput>> = {
  logo: 'logo',
  railyard: TrainTrack,
  registry: Database,
  'template-mod': Package,
  website: Globe,
  tools: Wrench,
  community: HeartHandshake,
  discord: 'discord',
  github: 'github',
  theme: SunMoon,
  browse: Compass,
  library: Inbox,
  profiles: Users,
  logs: Terminal,
  settings: Settings,
  launch: Play,
  stop: Square,
  refresh: RefreshCw,
  download: Download,
  analytics: ChartLine,
  'world-map': Globe,
  docs: FileSearchCorner,
  updates: Megaphone,
  trending: TrendingUp,
  playground: FileCode2,
  credits: Users,
  license: Scale,
  contribute: Heart,
  'theme-light': Sun,
  'theme-dark': Moon,
  'theme-system': SunMoon,
};

export function resolveNavbarIcon(
  icon: AppIconValue | undefined,
  iconKey?: NavIconKey,
): AppIconInput {
  if (iconKey && WEBSITE_NAV_ICON_BY_KEY[iconKey]) {
    return WEBSITE_NAV_ICON_BY_KEY[iconKey] as AppIconInput;
  }

  return icon;
}

export function resolveNavbarBrandIcon(iconKey?: NavIconKey): AppIconInput {
  if (iconKey && WEBSITE_NAV_ICON_BY_KEY[iconKey]) {
    return WEBSITE_NAV_ICON_BY_KEY[iconKey] as AppIconInput;
  }

  return Home;
}
