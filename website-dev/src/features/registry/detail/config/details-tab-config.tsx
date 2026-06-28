import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Database,
  FileArchive,
  Road,
  History,
  Layers,
  Earth,
  Plane,
  RefreshCcw,
  Tag,
  User,
  Users,
  LayoutGrid,
  Circle,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "@/lib/router";
import { formatRegistryDate } from "@/features/registry/detail/lib/format-registry-date";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";

export type DetailsTabResolvedCard = {
  title: string;
  titleTooltipContent?: ReactNode;
  titleTooltipAriaLabel?: string;
  icon: LucideIcon;
  value: string | ReactNode;
  link?: string;
};

export type DetailsTabResolvedSection = {
  title: string;
  icon: LucideIcon;
  cards: DetailsTabResolvedCard[];
};

type DetailsTabCardConfig = {
  title: string;
  titleTooltipContent?: ReactNode;
  getTitleTooltipContent?: (detail: RegistryDetailModel) => ReactNode;
  titleTooltipAriaLabel?: string;
  icon: LucideIcon;
  getValue: (detail: RegistryDetailModel) => string | ReactNode;
  getLink?: (detail: RegistryDetailModel) => string | null;
  shouldRender?: (detail: RegistryDetailModel) => boolean;
};

type DetailsTabSectionConfig = {
  title: string;
  icon: LucideIcon;
  assetTypes: "all" | string[];
  cards: DetailsTabCardConfig[];
};

function formatNumber(value: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "\u2014";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function formatFileSizeMb(value: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "\u2014";
  }

  const rounded = Math.round(value * 100) / 100;
  return `${rounded.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: 2,
  })} MB`;
}

function getDetailBasePath(detail: RegistryDetailModel): string {
  return `/registry/${detail.routeSegment}/${detail.id}`;
}

function formatPlayableAreaKm2(value: number | null): ReactNode {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "\u2014";
  }

  return (
    <>
      {new Intl.NumberFormat("en-US").format(value)} km<sup>2</sup>
    </>
  );
}

function getDemandDataTooltipContent(detail: RegistryDetailModel): ReactNode {
  return (
    <>
      Data Quality refers to the quality and granularity of the source of the map&apos;s demand
      data.{" "}
      <Link
        to="/registry/docs/data-quality"
        className="underline transition-colors hover:text-[var(--dd-accent)]"
        style={
          {
            "--dd-accent": `light-dark(${detail.typeConfig.accentLight}, ${detail.typeConfig.accentDark})`,
          } as CSSProperties
        }
      >
        Learn more →
      </Link>
    </>
  );
}

function getLevelOfDetailTooltipContent(detail: RegistryDetailModel): ReactNode {
  return (
    <>
      Level of Detail measures how distributed and granular the map&apos;s demand points are.{" "}
      <Link
        to="/registry/docs/data-quality"
        className="underline transition-colors hover:text-[var(--dd-accent)]"
        style={
          {
            "--dd-accent": `light-dark(${detail.typeConfig.accentLight}, ${detail.typeConfig.accentDark})`,
          } as CSSProperties
        }
      >
        Learn more →
      </Link>
    </>
  );
}

const DETAILS_TAB_SECTIONS_CONFIG: DetailsTabSectionConfig[] = [
  {
    title: "Version Info",
    icon: History,
    assetTypes: "all",
    cards: [
      {
        title: "Date Published",
        icon: CalendarDays,
        getValue: (detail) => formatRegistryDate(detail.publishedDate),
      },
      {
        title: "Date Updated",
        icon: RefreshCcw,
        getValue: (detail) => formatRegistryDate(detail.updatedDate),
      },
      {
        title: "Latest Version",
        icon: Tag,
        getValue: (detail) => detail.latestVersion ?? "\u2014",
        getLink: (detail) =>
          detail.latestVersion
            ? `${getDetailBasePath(detail)}/versions/${encodeURIComponent(detail.latestVersion)}`
            : null,
      },
      {
        title: "Version Count",
        icon: BadgeCheck,
        getValue: (detail) => new Intl.NumberFormat("en-US").format(detail.integrityVersionCount),
        getLink: (detail) => `${getDetailBasePath(detail)}/versions`,
      },
    ],
  },
  {
    title: "Map Stats",
    icon: Users,
    assetTypes: ["maps"],
    cards: [
      {
        title: "Data Quality",
        titleTooltipAriaLabel: "About Data Quality",
        getTitleTooltipContent: (detail) => getDemandDataTooltipContent(detail),
        icon: BadgeCheck,
        getValue: (detail) => detail.mapFields?.sourceQuality ?? "\u2014",
      },
      {
        title: "Level of Detail",
        titleTooltipAriaLabel: "About Level of Detail",
        getTitleTooltipContent: (detail) => getLevelOfDetailTooltipContent(detail),
        icon: Layers,
        getValue: (detail) => detail.mapFields?.levelOfDetail ?? "\u2014",
      },
      {
        title: "Demand",
        icon: Users,
        getValue: (detail) => formatNumber(detail.mapFields?.population ?? null),
      },
      {
        title: "Pops",
        icon: User,
        getValue: (detail) => formatNumber(detail.mapFields?.populationCount ?? null),
      },
      {
        title: "Demand Points",
        icon: Circle,
        getValue: (detail) => formatNumber(detail.mapFields?.pointsCount ?? null),
      },
      {
        title: "Playable Area",
        icon: Earth,
        getValue: (detail) => formatPlayableAreaKm2(detail.mapFields?.playableAreaKm2 ?? null),
      },
    ],
  },
  {
    title: "File Sizes",
    icon: Database,
    assetTypes: ["maps"],
    cards: [
      {
        title: "PMTiles",
        icon: LayoutGrid,
        getValue: (detail) => formatFileSizeMb(detail.mapFields?.fileSizes.pmtiles ?? null),
      },
      {
        title: "Buildings Index",
        icon: Building2,
        getValue: (detail) => formatFileSizeMb(detail.mapFields?.fileSizes.buildingsIndex ?? null),
      },
      {
        title: "Demand Data",
        icon: User,
        getValue: (detail) => formatFileSizeMb(detail.mapFields?.fileSizes.demandData ?? null),
      },
      {
        title: "Ocean Depth Index",
        icon: Waves,
        getValue: (detail) => formatFileSizeMb(detail.mapFields?.fileSizes.oceanDepthIndex ?? null),
        shouldRender: (detail) => typeof detail.mapFields?.fileSizes.oceanDepthIndex === "number",
      },
      {
        title: "Roads",
        icon: Road,
        getValue: (detail) => formatFileSizeMb(detail.mapFields?.fileSizes.roads ?? null),
      },
      {
        title: "Runways & Taxiways",
        icon: Plane,
        getValue: (detail) => formatFileSizeMb(detail.mapFields?.fileSizes.runwaysTaxiways ?? null),
      },
      {
        title: "Other",
        icon: FileArchive,
        getValue: (detail) => formatFileSizeMb(detail.mapFields?.fileSizes.other ?? null),
        shouldRender: (detail) => typeof detail.mapFields?.fileSizes.other === "number",
      },
    ],
  },
];

export function getDetailsTabSections(detail: RegistryDetailModel): DetailsTabResolvedSection[] {
  return DETAILS_TAB_SECTIONS_CONFIG.filter((section) => {
    if (section.assetTypes === "all") {
      return true;
    }
    return section.assetTypes.includes(detail.typeId);
  }).map((section) => ({
    title: section.title,
    icon: section.icon,
    cards: section.cards
      .filter((card) => card.shouldRender?.(detail) ?? true)
      .map((card) => {
        const link = card.getLink?.(detail) ?? undefined;
        return {
          title: card.title,
          titleTooltipContent: card.getTitleTooltipContent?.(detail) ?? card.titleTooltipContent,
          titleTooltipAriaLabel: card.titleTooltipAriaLabel,
          icon: card.icon,
          value: card.getValue(detail),
          link,
        };
      }),
  }));
}
