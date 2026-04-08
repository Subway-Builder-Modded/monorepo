'use client';

import { ChartLine, Download, ExternalLink, Globe, Users } from 'lucide-react';
import { createElement } from 'react';
import { useTheme } from 'next-themes';

import { AuthorName } from '@/components/shared/author-name';
import { GalleryImage } from '@/features/railyard/components/gallery-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getModeHex, PROJECT_COLOR_SCHEMES } from '@/config/theme/colors';
import { getAuthorAttributionHref } from '@/lib/authors';
import { getCountryFlagIcon } from '@/lib/railyard/flags';
import { formatDataQuality } from '@/lib/railyard/map-filter-values';
import type { MapManifest, ModManifest, VersionInfo } from '@/types/registry';

interface ProjectHeaderProps {
  type: 'mods' | 'maps';
  item: ModManifest | MapManifest;
  latestVersion?: VersionInfo;
  versionsLoading: boolean;
  totalDownloads?: number;
}

function isMapManifest(item: ModManifest | MapManifest): item is MapManifest {
  return 'city_code' in item;
}

export function ProjectHeader({
  type,
  item,
  latestVersion,
  versionsLoading,
  totalDownloads,
}: ProjectHeaderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mapItem = isMapManifest(item) ? item : null;

  const badges = mapItem
    ? [
        mapItem.location,
        formatDataQuality(mapItem.source_quality ?? ''),
        mapItem.level_of_detail,
        ...(mapItem.special_demand ?? []),
      ].filter((v): v is string => Boolean(v))
    : (item.tags ?? []);

  const mapCountryCode = mapItem?.country?.trim().toUpperCase();
  const CountryFlag = mapCountryCode
    ? getCountryFlagIcon(mapCountryCode)
    : null;
  const authorHref = getAuthorAttributionHref(item);

  const handleOpenInRailyard = () => {
    window.location.href = `railyard://open?type=${encodeURIComponent(type)}&id=${encodeURIComponent(item.id)}`;
  };
  const handleViewAnalytics = () => {
    window.location.href = `/registry/${type}/${encodeURIComponent(item.id)}`;
  };
  const registryAccent = getModeHex(
    PROJECT_COLOR_SCHEMES.registry.accentColor,
    isDark,
  );
  const registryText = getModeHex(
    PROJECT_COLOR_SCHEMES.registry.textColorInverted,
    isDark,
  );

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-7">
      <div className="relative h-[7rem] w-[7rem] shrink-0 overflow-hidden rounded-xl bg-muted border border-border/50 sm:h-[10rem] sm:w-[10rem]">
        <GalleryImage
          type={type}
          id={item.id}
          imagePath={item.gallery?.[0]}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:pt-1">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-4xl">
              {item.name}
            </h1>
            {mapItem?.city_code && (
              <div className="mt-1 flex items-center gap-2.5 text-sm">
                <span className="font-bold text-foreground">
                  {mapItem.city_code}
                </span>
                {mapItem.country && (
                  <>
                    <div className="h-4 w-0.5 shrink-0 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {CountryFlag &&
                        createElement(CountryFlag, {
                          className: 'h-3.5 w-5 rounded-[1px]',
                        })}
                      <span>{mapItem.country.trim().toUpperCase()}</span>
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="mt-1 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
              <span className="shrink-0">by</span>
              <a
                href={authorHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 max-w-full items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <AuthorName
                  author={item}
                  className="min-w-0 max-w-full"
                  nameClassName="truncate"
                />
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {typeof totalDownloads === 'number' && (
              <span className="flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />
                {totalDownloads.toLocaleString()}
              </span>
            )}
            {mapItem && (mapItem.population ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {mapItem.population!.toLocaleString()}
              </span>
            )}
            {item.source && (
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
              >
                <Globe className="h-3.5 w-3.5" />
                Source
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 -ml-1.5">
              {badges.map((badge) => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 sm:pt-6">
          {versionsLoading ? (
            <Button size="sm" isDisabled>
              Loading...
            </Button>
          ) : latestVersion ? (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="!bg-[var(--suite-accent-light)] !text-[var(--suite-text-inverted-light)] border-transparent hover:!brightness-90 dark:!bg-[var(--suite-accent-dark)] dark:!text-[var(--suite-text-inverted-dark)]"
                onPress={handleOpenInRailyard}
              >
                <Download className="h-4 w-4" />
                Open in Railyard
              </Button>
              <Button
                size="sm"
                className="border-transparent hover:!brightness-95"
                style={{
                  backgroundColor: registryAccent,
                  color: registryText,
                }}
                onPress={handleViewAnalytics}
              >
                <ChartLine className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
