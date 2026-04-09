import { CheckCircle, Download, MapPin, Package, Users } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { AssetType } from '@sbm/core/railyard/core/asset-types';
import { formatListingDescriptionPreview } from '@sbm/core/railyard/core/description-preview';
import type { SearchViewMode } from '@sbm/core/railyard/core/search-view-mode';
import type { SharedItemData } from '@sbm/core/railyard/core/shared-item';
import { getCountryFlagIcon } from './flags';
import { AuthorName } from './author-name';
import { cx } from './cx';

const TYPE_PILL_CLASS =
  'inline-flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 text-foreground text-xs font-medium px-2 py-0.5 rounded-full';
const CARD_IMAGE_CLASS =
  'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]';
const CARD_TITLE_CLASS =
  'font-semibold text-sm leading-snug text-foreground truncate';
const CARD_AUTHOR_CLASS =
  'flex items-center gap-1 text-xs text-muted-foreground mt-0.5 min-w-0';
const CARD_ARTICLE_BASE =
  'group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-150 hover:border-foreground/20 hover:shadow-sm';

export interface ItemCardProps {
  type: AssetType;
  item: SharedItemData;
  href: string;
  installedVersion?: string;
  totalDownloads?: number;
  viewMode?: SearchViewMode;
  descriptionMode?: 'raw' | 'preview';
  renderLink?: (
    href: string,
    children: ReactNode,
    className: string,
  ) => ReactNode;
  renderImage: (
    imagePath: string | undefined,
    className: string,
  ) => ReactNode;
}

interface ItemCardPresentation {
  isMap: boolean;
  badges: string[];
  mapCityCode: string;
  mapCountry: string;
  mapPopulation?: number;
  CountryFlag: ReturnType<typeof getCountryFlagIcon> | null;
  showDownloads: boolean;
}

function buildItemCardPresentation(
  item: SharedItemData,
  totalDownloads?: number,
): ItemCardPresentation {
  const isMap = 'city_code' in item && item.city_code !== undefined;
  const mapBadges = isMap
    ? [
        item.location,
        item.source_quality,
        item.level_of_detail,
        ...(item.special_demand ?? []),
      ].filter((value): value is string => Boolean(value))
    : [];

  const mapCityCode = isMap ? (item.city_code ?? '').trim() : '';
  const mapCountry = isMap ? (item.country ?? '').trim().toUpperCase() : '';

  return {
    isMap,
    badges: isMap ? mapBadges : (item.tags ?? []),
    mapCityCode,
    mapCountry,
    mapPopulation: isMap ? item.population : undefined,
    CountryFlag: isMap ? getCountryFlagIcon(mapCountry) : null,
    showDownloads: typeof totalDownloads === 'number',
  };
}

function MapLocationMeta({
  cityCode,
  country,
  CountryFlag,
}: {
  cityCode: string;
  country: string;
  CountryFlag: ReturnType<typeof getCountryFlagIcon> | null;
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
          {CountryFlag && <CountryFlag className="h-3 w-4 rounded-[1px]" />}
          <span>{country.toUpperCase()}</span>
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
      className={cx(
        'flex flex-col gap-1 text-xs text-muted-foreground shrink-0',
        className,
      )}
    >
      {isMap && (population ?? 0) > 0 && (
        <StatMetric icon={Users} value={population!} />
      )}
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
      className={cx(
        'flex items-center gap-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{value.toLocaleString()}</span>
    </div>
  );
}

function BadgeEl({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant: 'secondary' | 'outline';
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md border px-1.5 py-0 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variant === 'secondary'
          ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
          : 'text-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}

function ItemBadgesWrap({
  badges,
  visibleBadges,
  align,
  badgeClassName,
  maxWidthStyle,
}: {
  badges: string[];
  visibleBadges: string[];
  align: 'left' | 'right';
  badgeClassName: string;
  maxWidthStyle?: { maxWidth: string };
}) {
  const overflowCount = Math.max(0, badges.length - visibleBadges.length);
  const justifyClass = align === 'left' ? 'justify-start' : 'justify-end';
  return (
    <div
      className={cx('flex flex-wrap gap-1', justifyClass)}
      style={maxWidthStyle}
    >
      {visibleBadges.map((badge) => (
        <BadgeEl key={badge} variant="secondary" className={badgeClassName}>
          {badge}
        </BadgeEl>
      ))}
      {overflowCount > 0 && (
        <BadgeEl variant="outline" className={badgeClassName}>
          +{overflowCount}
        </BadgeEl>
      )}
    </div>
  );
}

function ItemBadgesMeasured({
  badges,
  visibleBadges,
  align,
  badgeClassName,
  maxWidthStyle,
  fixedVisibleCount,
}: {
  badges: string[];
  visibleBadges: string[];
  align: 'left' | 'right';
  badgeClassName: string;
  maxWidthStyle?: { maxWidth: string };
  fixedVisibleCount?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(visibleBadges.length);
  const justifyClass = align === 'left' ? 'justify-start' : 'justify-end';

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
      const gap =
        Number.parseFloat(getComputedStyle(container).columnGap) || 0;
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
        className={cx('flex flex-nowrap gap-1 overflow-hidden', justifyClass)}
        style={maxWidthStyle}
      >
        {visibleBadges.slice(0, visibleCount).map((badge) => (
          <BadgeEl key={badge} variant="secondary" className={badgeClassName}>
            {badge}
          </BadgeEl>
        ))}
        {overflowCount > 0 && (
          <BadgeEl variant="outline" className={badgeClassName}>
            +{overflowCount}
          </BadgeEl>
        )}
      </div>

      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[99999px] -top-[99999px] flex gap-1 opacity-0"
      >
        {visibleBadges.map((badge) => (
          <span key={badge} data-measure="badge">
            <BadgeEl variant="secondary" className={badgeClassName}>
              {badge}
            </BadgeEl>
          </span>
        ))}
        <span data-measure="overflow">
          <BadgeEl variant="outline" className={badgeClassName}>
            +{badges.length}
          </BadgeEl>
        </span>
      </div>
    </>
  );
}

function ItemBadges({
  badges,
  align = 'right',
  compact = false,
  wrap = false,
  fixedVisibleCount,
  maxWidthPercentage = 1,
}: {
  badges: string[];
  align?: 'left' | 'right';
  compact?: boolean;
  wrap?: boolean;
  fixedVisibleCount?: number;
  maxWidthPercentage?: number;
}) {
  if (badges.length === 0) return null;

  const maxBadgeCount =
    fixedVisibleCount === undefined
      ? badges.length
      : Math.max(1, fixedVisibleCount);
  const visibleBadges = badges.slice(0, maxBadgeCount);
  const badgeClassName = compact
    ? 'text-[11px] px-1.5 py-0 h-5'
    : 'text-xs px-1.5 py-0';
  const clampedMaxWidthPercent =
    Math.min(1, Math.max(0, maxWidthPercentage)) * 100;
  const maxWidthStyle =
    clampedMaxWidthPercent < 100
      ? { maxWidth: `${clampedMaxWidthPercent}%` }
      : undefined;

  if (wrap) {
    return (
      <ItemBadgesWrap
        badges={badges}
        visibleBadges={visibleBadges}
        align={align}
        badgeClassName={badgeClassName}
        maxWidthStyle={maxWidthStyle}
      />
    );
  }

  return (
    <ItemBadgesMeasured
      badges={badges}
      visibleBadges={visibleBadges}
      align={align}
      badgeClassName={badgeClassName}
      maxWidthStyle={maxWidthStyle}
      fixedVisibleCount={fixedVisibleCount}
    />
  );
}

function defaultRenderLink(
  href: string,
  children: ReactNode,
  className: string,
) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export const ItemCard = memo(function ItemCard({
  item,
  href,
  installedVersion,
  totalDownloads,
  viewMode = 'full',
  descriptionMode = 'raw',
  renderLink = defaultRenderLink,
  renderImage,
}: ItemCardProps) {
  const presentation = buildItemCardPresentation(item, totalDownloads);
  const description = useMemo(() => {
    const normalized =
      descriptionMode === 'preview'
        ? formatListingDescriptionPreview(item.description ?? '')
        : (item.description ?? '').trim();

    return normalized || 'No description provided.';
  }, [descriptionMode, item.description]);

  if (viewMode === 'list') {
    return renderLink(
      href,
      <article
        className={cx(
          CARD_ARTICLE_BASE,
          installedVersion && 'ring-1 ring-primary/40',
        )}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-44 sm:h-36 sm:w-48 md:w-52 overflow-hidden bg-muted shrink-0">
            {installedVersion && (
              <div className="absolute top-2 right-2 z-10">
                <span className="inline-flex items-center gap-1 rounded-md border border-transparent bg-green-600/90 text-white text-xs font-medium px-1.5 py-0.5 shadow-sm">
                  <CheckCircle className="h-2.5 w-2.5" />
                  {installedVersion}
                </span>
              </div>
            )}
            <div className="absolute top-2 left-2 z-10">
              <span className={TYPE_PILL_CLASS}>
                {presentation.isMap ? (
                  <MapPin className="h-2.5 w-2.5" />
                ) : (
                  <Package className="h-2.5 w-2.5" />
                )}
                {presentation.isMap ? 'Map' : 'Mod'}
              </span>
            </div>
            {renderImage(item.gallery?.[0], CARD_IMAGE_CLASS)}
          </div>

          <div className="flex flex-col flex-1 p-3 gap-2 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className={CARD_TITLE_CLASS}>{item.name}</h3>
                <p className={CARD_AUTHOR_CLASS}>
                  <span className="shrink-0">by</span>
                  <AuthorName
                    name={item.author.display_name}
                    contributorTier={item.author.contributor_tier ?? undefined}
                    size="sm"
                  />
                </p>
              </div>
              {presentation.isMap && (
                <MapLocationMeta
                  cityCode={presentation.mapCityCode}
                  country={presentation.mapCountry}
                  CountryFlag={presentation.CountryFlag}
                />
              )}
            </div>

            <p className="relative pl-2 text-xs text-muted-foreground/90 leading-relaxed line-clamp-1 before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-px before:bg-border/80">
              {description}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-auto">
              <ItemStats
                isMap={presentation.isMap}
                population={presentation.mapPopulation}
                showDownloads={presentation.showDownloads}
                totalDownloads={totalDownloads}
              />
              <ItemBadges
                badges={presentation.badges}
                align="left"
                wrap={false}
                fixedVisibleCount={3}
              />
            </div>
          </div>
        </div>
      </article>,
      'block w-full',
    );
  }

  if (viewMode === 'compact') {
    const hasMapPopulation =
      presentation.isMap && (presentation.mapPopulation ?? 0) > 0;
    const hasDownloads = presentation.showDownloads;

    return renderLink(
      href,
      <article
        className={cx(
          CARD_ARTICLE_BASE,
          'h-full flex flex-col',
          installedVersion && 'ring-1 ring-primary/40',
        )}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted shrink-0">
          {installedVersion && (
            <div className="absolute top-2 right-2 z-10">
              <span className="inline-flex items-center gap-1 rounded-md border border-transparent bg-green-600/90 text-white text-[11px] font-medium h-5 px-1.5 shadow-sm">
                <CheckCircle className="h-2.5 w-2.5" />
                {installedVersion}
              </span>
            </div>
          )}
          <div className="absolute top-2 left-2 z-10">
            <span className={TYPE_PILL_CLASS}>
              {presentation.isMap ? (
                <MapPin className="h-2.5 w-2.5" />
              ) : (
                <Package className="h-2.5 w-2.5" />
              )}
              {presentation.isMap ? 'Map' : 'Mod'}
            </span>
          </div>
          {renderImage(item.gallery?.[0], CARD_IMAGE_CLASS)}
        </div>

        <div className="flex flex-col flex-1 p-3 gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={CARD_TITLE_CLASS}>{item.name}</h3>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 min-w-0">
                <span className="shrink-0">by</span>
                <AuthorName
                  name={item.author.display_name}
                  contributorTier={item.author.contributor_tier ?? undefined}
                />
              </p>
            </div>
            {presentation.isMap && (
              <MapLocationMeta
                cityCode={presentation.mapCityCode}
                country={presentation.mapCountry}
                CountryFlag={presentation.CountryFlag}
              />
            )}
          </div>

          <p className="relative flex-1 pl-2 text-[11px] text-muted-foreground/90 leading-relaxed line-clamp-2 before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-px before:bg-border/80">
            {description}
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
      </article>,
      'block w-full',
    );
  }

  // 'full' view (default)
  return renderLink(
    href,
    <article
      className={cx(
        'group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-150 hover:border-foreground/20 hover:shadow-sm h-full flex flex-col',
        installedVersion && 'ring-1 ring-primary/40',
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-muted shrink-0">
        {installedVersion && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 rounded-md border border-transparent bg-green-600/90 text-white text-xs font-medium px-1.5 py-0.5 shadow-sm">
              <CheckCircle className="h-2.5 w-2.5" />
              {installedVersion}
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2 z-10">
          <span className={TYPE_PILL_CLASS}>
            {presentation.isMap ? (
              <MapPin className="h-2.5 w-2.5" />
            ) : (
              <Package className="h-2.5 w-2.5" />
            )}
            {presentation.isMap ? 'Map' : 'Mod'}
          </span>
        </div>
        {renderImage(item.gallery?.[0], CARD_IMAGE_CLASS)}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className={CARD_TITLE_CLASS}>{item.name}</h3>
            <p className={CARD_AUTHOR_CLASS}>
              <span className="shrink-0">by</span>
              <AuthorName
                name={item.author.display_name}
                contributorTier={item.author.contributor_tier ?? undefined}
                size="sm"
              />
            </p>
          </div>
          {presentation.isMap && (
            <MapLocationMeta
              cityCode={presentation.mapCityCode}
              country={presentation.mapCountry}
              CountryFlag={presentation.CountryFlag}
            />
          )}
        </div>

        <p className="relative flex-1 pl-2 text-xs text-muted-foreground/90 leading-relaxed line-clamp-2 before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-px before:bg-border/80">
          {description}
        </p>

        <div className="flex items-end justify-between gap-2 mt-auto">
          <ItemStats
            isMap={presentation.isMap}
            population={presentation.mapPopulation}
            showDownloads={presentation.showDownloads}
            totalDownloads={totalDownloads}
          />
          <ItemBadges
            badges={presentation.badges}
            maxWidthPercentage={0.65}
          />
        </div>
      </div>
    </article>,
    'block w-full',
  );
});

