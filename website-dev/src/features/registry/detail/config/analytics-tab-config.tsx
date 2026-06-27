import type { ReactNode } from "react";
import {
  BarChart3,
  Circle,
  Earth,
  ExternalLink,
  Download,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  RankBadge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { Link } from "@/lib/router";
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
  getTitleAccessory?: (detail: RegistryDetailModel) => ReactNode;
  assetTypes?: "all" | string[];
};

type AnalyticsTabSectionConfig = {
  title: string;
  icon: LucideIcon;
  assetTypes: "all" | string[];
  cards: AnalyticsTabCardConfig[];
};

function RankAccessory({ detail, rank }: { detail: RegistryDetailModel; rank: number | null }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RankBadge
            rank={rank}
            className="h-6 w-auto min-w-6 cursor-help rounded-md px-1.5 text-[11px] shadow-sm"
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64">
          <span className="inline-flex items-center gap-1.5">
            <span>Ranking among</span>
            <Link
              to="http://localhost:5173/registry/analytics/map-statistics"
              className="inline-flex items-center gap-1 font-bold underline-offset-2 transition hover:underline"
              style={{
                color: `light-dark(${detail.typeConfig.accentLight}, ${detail.typeConfig.accentDark})`,
              }}
            >
              {detail.typeConfig.pluralLabel}
              <ExternalLink className="size-3 text-muted-foreground" aria-hidden={true} />
            </Link>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "\u2014";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatAreaKm2(value: number | null): ReactNode {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "\u2014";
  }

  return (
    <>
      {formatNumber(value)} km<sup>2</sup>
    </>
  );
}

const ANALYTICS_TAB_SECTIONS_CONFIG: AnalyticsTabSectionConfig[] = [
  {
    title: "Analytics",
    icon: BarChart3,
    assetTypes: "all",
    cards: [
      {
        title: "Downloads",
        icon: Download,
        getValue: (detail) => formatNumber(detail.downloadAnalytics.allTime),
        getTitleAccessory: (detail) => (
          <RankAccessory detail={detail} rank={detail.downloadAnalytics.rank} />
        ),
      },
      {
        title: "Demand",
        icon: Users,
        getValue: (detail) => formatNumber(detail.mapFields?.population ?? null),
        getTitleAccessory: (detail) => (
          <RankAccessory detail={detail} rank={detail.mapFields?.rankings.population ?? null} />
        ),
        assetTypes: ["maps"],
      },
      {
        title: "Pops",
        icon: User,
        getValue: (detail) => formatNumber(detail.mapFields?.populationCount ?? null),
        getTitleAccessory: (detail) => (
          <RankAccessory
            detail={detail}
            rank={detail.mapFields?.rankings.populationCount ?? null}
          />
        ),
        assetTypes: ["maps"],
      },
      {
        title: "Demand Points",
        icon: Circle,
        getValue: (detail) => formatNumber(detail.mapFields?.pointsCount ?? null),
        getTitleAccessory: (detail) => (
          <RankAccessory detail={detail} rank={detail.mapFields?.rankings.pointsCount ?? null} />
        ),
        assetTypes: ["maps"],
      },
      {
        title: "Playable Area",
        icon: Earth,
        getValue: (detail) => formatAreaKm2(detail.mapFields?.playableAreaKm2 ?? null),
        getTitleAccessory: (detail) => (
          <RankAccessory
            detail={detail}
            rank={detail.mapFields?.rankings.playableAreaKm2 ?? null}
          />
        ),
        assetTypes: ["maps"],
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
    cards: section.cards
      .filter((card) => {
        if (!card.assetTypes || card.assetTypes === "all") {
          return true;
        }
        return card.assetTypes.includes(detail.typeId);
      })
      .map((card) => ({
        title: card.title,
        titleAccessory: card.getTitleAccessory?.(detail),
        icon: card.icon,
        value: card.getValue(detail),
      })),
  }));
}
