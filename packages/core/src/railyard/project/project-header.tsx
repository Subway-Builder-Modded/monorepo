import { Download, ExternalLink, Globe, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import type { AssetType } from '../railyard-core/asset-types';
import { formatSourceQuality } from '../railyard-core/map-filter-values';
import type { SharedItemData } from '../railyard-core/shared-item';
import { AuthorName } from '../railyard-ui/shared/author-name';
import { cx } from '../railyard-ui/shared/cx';
import { getCountryFlagIcon } from '../railyard-ui/shared/flags';

export interface ProjectHeaderProps {
  type: AssetType;
  item: SharedItemData;
  totalDownloads?: number;
  /**
   * Renders the item thumbnail image. Called with the first gallery path (may be
   * undefined) and a className string for layout/sizing.
   */
  renderImage: (imagePath: string | undefined, className: string) => ReactNode;
  /**
   * Wraps the author name in a platform-appropriate link.
   * The callback receives the pre-rendered author name element.
   */
  renderAuthorLink: (children: ReactNode) => ReactNode;
  /**
   * Optional: renders an external source link. If omitted and the item has a
   * source URL, no source link is shown.
   */
  renderSourceLink?: (href: string, children: ReactNode) => ReactNode;
  /**
   * Optional: platform-specific action buttons (install, uninstall, analytics,
   * deep link, etc.) rendered in the top-right corner.
   */
  renderActions?: ReactNode;
}

export function ProjectHeader({
  type,
  item,
  totalDownloads,
  renderImage,
  renderAuthorLink,
  renderSourceLink,
  renderActions,
}: ProjectHeaderProps) {
  const isMap = type === 'map';

  const badges = isMap
    ? [
        item.location,
        item.source_quality ? formatSourceQuality(item.source_quality) : undefined,
        item.level_of_detail,
        ...(item.special_demand ?? []),
      ].filter((v): v is string => Boolean(v))
    : (item.tags ?? []);

  const mapCountryCode = item.country?.trim().toUpperCase();
  const CountryFlag = mapCountryCode ? getCountryFlagIcon(mapCountryCode) : null;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-7">
      <div className="relative h-[7rem] w-[7rem] shrink-0 overflow-hidden rounded-xl bg-muted border border-border/50 sm:h-[10rem] sm:w-[10rem]">
        {renderImage(
          item.gallery?.[0],
          'absolute inset-0 h-full w-full object-cover',
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:pt-1">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-4xl">
              {item.name}
            </h1>
            {isMap && item.city_code && (
              <div className="mt-1 flex items-center gap-2.5 text-sm">
                <span className="font-bold text-foreground">
                  {item.city_code}
                </span>
                {item.country && (
                  <>
                    <div className="h-4 w-0.5 shrink-0 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {CountryFlag &&
                        createElement(CountryFlag, {
                          className: 'h-3.5 w-5 rounded-[1px]',
                        })}
                      <span>{item.country.trim().toUpperCase()}</span>
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="mt-1 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
              <span className="shrink-0">by</span>
              {renderAuthorLink(
                <AuthorName
                  name={item.author.display_name}
                  contributorTier={item.author.contributor_tier ?? undefined}
                  className="min-w-0 max-w-full"
                />,
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {typeof totalDownloads === 'number' && (
              <span className="flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />
                {totalDownloads.toLocaleString()}
              </span>
            )}
            {isMap && (item.population ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {item.population!.toLocaleString()}
              </span>
            )}
            {item.source && renderSourceLink && (
              renderSourceLink(
                item.source,
                <span className={cx('inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline hover:no-underline')}>
                  <Globe className="h-3.5 w-3.5" />
                  Source
                  <ExternalLink className="h-3 w-3" />
                </span>,
              )
            )}
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 -ml-1.5">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {renderActions && (
          <div className="shrink-0 sm:pt-6">{renderActions}</div>
        )}
      </div>
    </div>
  );
}
