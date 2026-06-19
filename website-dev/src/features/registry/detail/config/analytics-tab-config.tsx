import type { ReactNode } from "react";
import {
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  Circle,
  Earth,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { RankBadge } from "@subway-builder-modded/shared-ui";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import type { DetailMetric } from "@/features/registry/detail/components/details-tab";

export type AnalyticsTabResolvedSection = {
  title: string;
  icon: LucideIcon;
  cards: DetailMetric[];
};

type AnalyticsTabCardConfig = {
  title: string;
  icon: LucideIcon;
  getValue: (detail: RegistryDetailModel) => string | ReactNode;
};

type AnalyticsTabSectionConfig = {
  title: string;
  icon: LucideIcon;
  assetTypes: "all" | string[];
  cards: AnalyticsTabCardConfig[];
};

function RankValue({ rank }: { rank: number | null }): ReactNode {
  return <RankBadge rank={rank} />;
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "\u2014";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

const ANALYTICS_TAB_SECTIONS_CONFIG: AnalyticsTabSectionConfig[] = [
  {
    title: "Analytics",
    icon: BarChart3,
    assetTypes: "all",
    cards: [
      {
        title: "Download Rank",
        icon: Trophy,
        getValue: (detail) => <RankValue rank={detail.downloadAnalytics.rank} />,
      },
      {
        title: "Downloads (All-Time)",
        icon: ArrowDownToLine,
        getValue: (detail) => formatNumber(detail.downloadAnalytics.allTime),
      },
      {
        title: "Downloads (14d)",
        icon: CalendarDays,
        getValue: (detail) => formatNumber(detail.downloadAnalytics.last14Days),
      },
      {
        title: "Downloads (7d)",
        icon: CalendarDays,
        getValue: (detail) => formatNumber(detail.downloadAnalytics.last7Days),
      },
    ],
  },
  {
    title: "Rankings",
    icon: Trophy,
    assetTypes: ["maps"],
    cards: [
      {
        title: "Modeled Demand",
        icon: Users,
        getValue: (detail) => <RankValue rank={detail.mapFields?.rankings.population ?? null} />,
      },
      {
        title: "Pops",
        icon: User,
        getValue: (detail) => (
          <RankValue rank={detail.mapFields?.rankings.populationCount ?? null} />
        ),
      },
      {
        title: "Demand Points",
        icon: Circle,
        getValue: (detail) => <RankValue rank={detail.mapFields?.rankings.pointsCount ?? null} />,
      },
      {
        title: "Playable Area",
        icon: Earth,
        getValue: (detail) => (
          <RankValue rank={detail.mapFields?.rankings.playableAreaKm2 ?? null} />
        ),
      },
    ],
  },
];

export function getAnalyticsTabSections(
  detail: RegistryDetailModel,
): AnalyticsTabResolvedSection[] {
  return ANALYTICS_TAB_SECTIONS_CONFIG.filter((section) => {
    if (section.assetTypes === "all") {
      return true;
    }
    return section.assetTypes.includes(detail.typeId);
  }).map((section) => ({
    title: section.title,
    icon: section.icon,
    cards: section.cards.map((card) => ({
      title: card.title,
      icon: card.icon,
      value: card.getValue(detail),
    })),
  }));
}
