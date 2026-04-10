import { Badge } from '@subway-builder-modded/shared-ui';
import { CheckCircle, Download, MapPin, Package, Users } from 'lucide-react';
import { memo, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { cn } from '../lib/cn';
import type { GalleryAssetType, SearchViewMode } from '../types';

const TYPE_PILL_CLASS =
  'inline-flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 text-foreground text-xs font-medium px-2 py-0.5 rounded-full';
const CARD_IMAGE_CLASS =
  'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]';
const CARD_TITLE_CLASS =
  'font-semibold text-sm leading-snug text-foreground truncate';
const CARD_AUTHOR_CLASS =
  'flex items-center gap-1 text-xs text-muted-foreground mt-0.5 min-w-0';
const CARD_ARTICLE_BASE =
  'group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer text-foreground transition-all duration-150 hover:border-foreground/20 hover:shadow-sm';

export interface ItemCardProps<T = { author_alias: string; contributor_tier?: string }> {
  type: GalleryAssetType;
  id: string;
  name: string;
  author: T;
  gallery?: string[];
  description?: string;
  city_code?: string | null;
  country?: string | null;
  location?: string;
  source_quality?: string;
  level_of_detail?: string;
  special_demand?: string[];
  tags?: string[];
  population?: number;
  installedVersion?: string;
  totalDownloads?: number;
  viewMode?: SearchViewMode;
  imagePath?: string;
  href?: string;
  /** Custom description formatter. If not provided, uses raw description */
  formatDescription?: (desc: string) => string;
  /** Callback to render the link wrapper for the card */
  renderLink: (props: { href: string; children: ReactNode }) => ReactNode;
  /** Callback to render the author name */
  renderAuthorName: (props: { name: string; contributorTier?: string; size?: 'sm' }) => ReactNode;
  /** Callback to resolve image URL */
  resolveImageUrl?: (type: GalleryAssetType, id: string, imagePath?: string) => string | null;
  /** Optional adapter to render image with app-specific components/hooks */
  renderImage?: (props: {
    type: GalleryAssetType;
    id: string;
    imagePath?: string;
    className: string;
    alt: string;
  }) => ReactNode;
}

interface ItemCardPresentation {
  isMap: boolean;
  badges: string[];
  mapCityCode: string;
  mapCountry: string;
  mapPopulation?: number;
  showDownloads: boolean;
}

function buildItemCardPresentation(
  type: GalleryAssetType,
  city_code?: string | null,
  country?: string | null,
  location?: string,
  source_quality?: string,
  level_of_detail?: string,
  special_demand?: string[],
  tags?: string[],
  population?: number,
  totalDownloads?: number,
): ItemCardPresentation {
  const isMap = type === 'map';
  const mapBadges = isMap
    ? [location, source_quality, level_of_detail, ...(special_demand ?? [])].filter(
        (value): value is string => Boolean(value),
      )
    : tags ?? [];

  return {
    isMap,
    badges: mapBadges,
    mapCityCode: isMap ? (city_code ?? '').trim() : '',
    mapCountry: isMap ? (country ?? '').trim().toUpperCase() : '',
    mapPopulation: isMap ? population : undefined,
    showDownloads: typeof totalDownloads === 'number',
  };
}

function MapLocationMeta({
  cityCode,
  country,
  countryFlag,
}: {
  cityCode: string;
  country: string;
  countryFlag?: ReactNode;
}) {
  if (!cityCode && !country) return null;

  return (
    <div className="shrink-0 text-right">
      {cityCode && (
        <span className="block text-xs font-mono font-bold text-foreground leading-none">
          {cityCode}
        </span>
      )}
      {country && (
        <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
          {countryFlag && countryFlag}
          <span>{country}</span>
        </span>
      )}
    </div>
  );
}

function ItemStats({
  isMap,
  population,
  showDownloads,
  totalDownloads,
  className,
}: {
  isMap: boolean;
  population?: number;
  showDownloads: boolean;
  totalDownloads?: number;
  className?: string;
}) {
  if (!(isMap && (population ?? 0) > 0) && !showDownloads) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-1 text-xs text-muted-foreground shrink-0',
        className,
      )}
    >
      {isMap && (population ?? 0) > 0 && <StatMetric icon={Users} value={population!} />}
      {showDownloads && <StatMetric icon={Download} value={totalDownloads!} />}
    </div>
  );
}

function StatMetric({
  icon: Icon,
  value,
  className,
}: {
  icon: typeof Users | typeof Download;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{value.toLocaleString()}</span>
    </div>
  );
}

interface ItemBadgesProps {
  badges: string[];
  align?: 'left' | 'right';
  compact?: boolean;
  wrap?: boolean;
  fixedVisibleCount?: number;
  maxWidthPercentage?: number;
}

export function ItemBadges({
  badges,
  align = 'right',
  compact = false,
  wrap = false,
  fixedVisibleCount,
  maxWidthPercentage = 1,
}: ItemBadgesProps) {
  if (badges.length === 0) return null;

  const maxBadgeCount =
    fixedVisibleCount === undefined ? badges.length : Math.max(1, fixedVisibleCount);
  const visibleBadges = badges.slice(0, maxBadgeCount);

  const justifyClass = align === 'left' ? 'justify-start' : 'justify-end';
  const badgeClassName = compact ? 'text-[11px] px-1.5 py-0 h-5' : 'text-xs px-1.5 py-0';
  const clampedMaxWidthPercent =
    Math.min(1, Math.max(0, maxWidthPercentage)) * 100;
  const maxWidthStyle =
    clampedMaxWidthPercent < 100 ? { maxWidth: `${clampedMaxWidthPercent}%` } : undefined;

  if (wrap) {
    const overflowCount = Math.max(0, badges.length - visibleBadges.length);
    return (
      <div
        className={cn('flex flex-wrap gap-1', justifyClass)}
        style={maxWidthStyle}
      >
        {visibleBadges.map((badge) => (
          <Badge key={badge} variant="secondary" className={badgeClassName}>
            {badge}
          </Badge>
        ))}
        {overflowCount > 0 && (
          <Badge variant="outline" className={badgeClassName}>
            +{overflowCount}
          </Badge>
        )}
      </div>
    );
  }

  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(visibleBadges.length);

  useLayoutEffect(() => {
    if (fixedVisibleCount !== undefined) {
      setVisibleCount(visibleBadges.length);
      return;
    }

    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const update = () => {
      const availableWidth = container.clientWidth;
      const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0;
      const badgeEls = Array.from(
        measure.querySelectorAll('[data-measure="badge"]'),
      ) as HTMLElement[];
      const badgeWidths = badgeEls.map(
        (el) => el.getBoundingClientRect().width,
      );

      const overflowEl = measure.querySelector<HTMLElement>(
        '[data-measure="overflow"]',
      );

      const measureOverflowWidth = (count: number) => {
        if (!overflowEl) return 0;
        overflowEl.textContent = `+${count}`;
        return overflowEl.getBoundingClientRect().width;
      };

      const widthForBadges = (count: number) =>
        badgeWidths.slice(0, count).reduce((sum, width) => sum + width, 0) +
        Math.max(0, count - 1) * gap;

      const fits = (count: number) => {
        const clamped = Math.max(0, Math.min(badgeWidths.length, count));
        const overflowCount = Math.max(0, badges.length - clamped);
        const overflowWidth =
          overflowCount > 0 ? measureOverflowWidth(overflowCount) : 0;
        const hasOverflow = overflowCount > 0;

        const totalWidth =
          widthForBadges(clamped) +
          (hasOverflow ? (clamped > 0 ? gap : 0) + overflowWidth : 0);

        return totalWidth <= availableWidth;
      };

      for (let count = badgeWidths.length; count >= 0; count -= 1) {
        if (fits(count)) {
          setVisibleCount(count);
          return;
        }
      }

      setVisibleCount(0);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(container);
    return () => ro.disconnect();
  }, [badges.length, fixedVisibleCount, visibleBadges]);

  const overflowCount = Math.max(0, badges.length - visibleCount);

  return (
    <>
      <div
        ref={containerRef}
        className={cn('flex flex-nowrap gap-1 overflow-hidden', justifyClass)}
        style={maxWidthStyle}
      >
        {visibleBadges.slice(0, visibleCount).map((badge) => (
          <Badge key={badge} variant="secondary" className={badgeClassName}>
            {badge}
          </Badge>
        ))}
        {overflowCount > 0 && (
          <Badge variant="outline" className={badgeClassName}>
            +{overflowCount}
          </Badge>
        )}
      </div>

      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[99999px] -top-[99999px] flex gap-1 opacity-0"
      >
        {visibleBadges.map((badge) => (
          <Badge
            key={badge}
            data-measure="badge"
            variant="secondary"
            className={badgeClassName}
          >
            {badge}
          </Badge>
        ))}
        <Badge
          data-measure="overflow"
          variant="outline"
          className={badgeClassName}
        >
          +{badges.length}
        </Badge>
      </div>
    </>
  );
}

const TypeIcon = ({ type }: { type: GalleryAssetType }) => {
  if (type === 'map') {
    return <MapPin className="h-2.5 w-2.5" />;
  }
  return <Package className="h-2.5 w-2.5" />;
};

const TypeLabel = ({ type }: { type: GalleryAssetType }) => {
  return type === 'map' ? 'Map' : 'Mod';
};

export const ItemCard = memo(function ItemCard({
  type,
  id,
  name,
  author,
  gallery,
  description,
  city_code,
  country,
  location,
  source_quality,
  level_of_detail,
  special_demand,
  tags,
  population,
  installedVersion,
  totalDownloads,
  viewMode = 'full',
  imagePath,
  href,
  formatDescription,
  renderLink,
  renderAuthorName,
  resolveImageUrl,
  renderImage,
}: ItemCardProps) {
  const presentation = buildItemCardPresentation(
    type,
    city_code,
    country,
    location,
    source_quality,
    level_of_detail,
    special_demand,
    tags,
    population,
    totalDownloads,
  );

  const normalizedDescription = useMemo(() => {
    const rawDesc = description ?? '';
    const trimmed = rawDesc.trim();
    return formatDescription ? formatDescription(trimmed) : trimmed || 'No description provided.';
  }, [description, formatDescription]);

  const imageUrl = resolveImageUrl ? resolveImageUrl(type, id, imagePath ?? gallery?.[0]) : (imagePath ?? gallery?.[0]);
  const imageNode = renderImage
    ? renderImage({
        type,
        id,
        imagePath: imagePath ?? gallery?.[0],
        className: CARD_IMAGE_CLASS,
        alt: name,
      })
    : imageUrl
      ? (
          <img
            src={imageUrl}
            alt={name}
            className={CARD_IMAGE_CLASS}
          />
        )
      : null;
  const targetHref =
    href ?? `/project/${type === 'map' ? 'maps' : 'mods'}/${id}`;

  if (viewMode === 'list') {
    return renderLink({
      href: targetHref,
      children: (
        <article
          className={cn(
            CARD_ARTICLE_BASE,
            installedVersion && 'ring-1 ring-primary/40',
          )}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-44 sm:h-36 sm:w-48 md:w-52 overflow-hidden bg-muted shrink-0">
              {installedVersion && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="success" className="gap-1 text-xs shadow-sm">
                    <CheckCircle className="h-2.5 w-2.5" />
                    {installedVersion}
                  </Badge>
                </div>
              )}
              <div className="absolute top-2 left-2 z-10">
                <span className={TYPE_PILL_CLASS}>
                  <TypeIcon type={type} />
                  <TypeLabel type={type} />
                </span>
              </div>
              {imageNode}
            </div>

            <div className="flex flex-col flex-1 p-3 gap-2 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className={CARD_TITLE_CLASS}>{name}</h3>
                  <p className={CARD_AUTHOR_CLASS}>
                    <span className="shrink-0">by</span>
                    {renderAuthorName({
                      name: author.author_alias,
                      contributorTier: author.contributor_tier,
                      size: 'sm',
                    })}
                  </p>
                </div>
                {presentation.isMap && (
                  <MapLocationMeta
                    cityCode={presentation.mapCityCode}
                    country={presentation.mapCountry}
                  />
                )}
              </div>

              <p className="relative pl-2 text-xs text-muted-foreground/90 leading-relaxed line-clamp-1 before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-px before:bg-border/80">
                {normalizedDescription}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-auto">
                <ItemStats
                  isMap={presentation.isMap}
                  population={presentation.mapPopulation}
                  showDownloads={presentation.showDownloads}
                  totalDownloads={totalDownloads}
                />
                <ItemBadges badges={presentation.badges} align="left" wrap={false} fixedVisibleCount={3} />
              </div>
            </div>
          </div>
        </article>
      ),
    });
  }

  if (viewMode === 'compact') {
    const hasMapPopulation = presentation.isMap && (presentation.mapPopulation ?? 0) > 0;
    const hasDownloads = presentation.showDownloads;

    return renderLink({
      href: targetHref,
      children: (
        <article
          className={cn(
            CARD_ARTICLE_BASE,
            'h-full flex flex-col',
            installedVersion && 'ring-1 ring-primary/40',
          )}
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-muted shrink-0">
            {installedVersion && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="success" className="gap-1 text-[11px] h-5 px-1.5 shadow-sm">
                  <CheckCircle className="h-2.5 w-2.5" />
                  {installedVersion}
                </Badge>
              </div>
            )}
            <div className="absolute top-2 left-2 z-10">
              <span className={TYPE_PILL_CLASS}>
                <TypeIcon type={type} />
                <TypeLabel type={type} />
              </span>
            </div>
            {imageNode}
          </div>

          <div className="flex flex-col flex-1 p-3 gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className={CARD_TITLE_CLASS}>{name}</h3>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 min-w-0">
                  <span className="shrink-0">by</span>
                  {renderAuthorName({
                    name: author.author_alias,
                    contributorTier: author.contributor_tier,
                  })}
                </p>
              </div>
              {presentation.isMap && (
                <MapLocationMeta
                  cityCode={presentation.mapCityCode}
                  country={presentation.mapCountry}
                />
              )}
            </div>

            <p className="relative flex-1 pl-2 text-[11px] text-muted-foreground/90 leading-relaxed line-clamp-2 before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-px before:bg-border/80">
              {normalizedDescription}
            </p>

            {(hasDownloads || hasMapPopulation) && (
              <div className="flex items-end justify-between gap-2 mt-auto min-h-4">
                <div className="min-w-0">
                  {hasDownloads && (
                    <StatMetric icon={Download} value={totalDownloads ?? 0} />
                  )}
                </div>
                <div className="min-w-0 text-right">
                  {hasMapPopulation && (
                    <StatMetric
                      icon={Users}
                      value={presentation.mapPopulation ?? 0}
                      className="justify-end"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </article>
      ),
    });
  }

  // Default: 'full' view
  return renderLink({
    href: targetHref,
    children: (
      <article
        className={cn(
          'group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer text-foreground transition-all duration-150 hover:border-foreground/20 hover:shadow-sm h-full flex flex-col',
          installedVersion && 'ring-1 ring-primary/40',
        )}
      >
        <div className="relative aspect-video overflow-hidden bg-muted shrink-0">
          {installedVersion && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="success" className="gap-1 text-xs shadow-sm">
                <CheckCircle className="h-2.5 w-2.5" />
                {installedVersion}
              </Badge>
            </div>
          )}
          <div className="absolute top-2 left-2 z-10">
            <span className={TYPE_PILL_CLASS}>
              <TypeIcon type={type} />
              <TypeLabel type={type} />
            </span>
          </div>
          {imageNode}
        </div>

        <div className="flex flex-col flex-1 p-4 gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={CARD_TITLE_CLASS}>{name}</h3>
              <p className={CARD_AUTHOR_CLASS}>
                <span className="shrink-0">by</span>
                {renderAuthorName({
                  name: author.author_alias,
                  contributorTier: author.contributor_tier,
                  size: 'sm',
                })}
              </p>
            </div>
            {presentation.isMap && (
              <MapLocationMeta
                cityCode={presentation.mapCityCode}
                country={presentation.mapCountry}
              />
            )}
          </div>

          <p className="relative flex-1 pl-2 text-xs text-muted-foreground/90 leading-relaxed line-clamp-2 before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-px before:bg-border/80">
            {normalizedDescription}
          </p>

          <div className="flex items-end justify-between gap-2 mt-auto">
            <ItemStats
              isMap={presentation.isMap}
              population={presentation.mapPopulation}
              showDownloads={presentation.showDownloads}
              totalDownloads={totalDownloads}
            />
            <ItemBadges badges={presentation.badges} maxWidthPercentage={0.65} />
          </div>
        </div>
      </article>
    ),
  });
});
ItemCard.displayName = 'ItemCard';
