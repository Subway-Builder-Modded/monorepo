'use client';

import { ChartLine, Download, ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTheme } from 'next-themes';

import { GalleryImage } from '../../../features/railyard/components/gallery-image';
import { Button } from '../../../components/ui/button';
import { getModeHex, PROJECT_COLOR_SCHEMES } from '../../../config/theme/colors';
import {
  getAuthorAttributionHref,
  getAuthorDisplayName,
  isExternalHref,
} from '../../../lib/authors';
import type { MapManifest, ModManifest, VersionInfo } from '../../../types/registry';
import { ProjectHeader as SharedProjectHeader } from '@sbm/shared/project/project-header';
import type { SharedItemData } from '@sbm/shared/railyard-core/shared-item';

interface ProjectHeaderProps {
  type: 'mods' | 'maps';
  item: ModManifest | MapManifest;
  latestVersion?: VersionInfo;
  versionsLoading: boolean;
  totalDownloads?: number;
}

function toSharedItem(item: ModManifest | MapManifest): SharedItemData {
  return {
    id: item.id,
    name: item.name,
    author: {
      display_name: getAuthorDisplayName(item),
      contributor_tier: item.contributor_tier ?? null,
    },
    description: item.description,
    tags: item.tags,
    gallery: item.gallery,
    source: item.source,
    city_code: 'city_code' in item ? item.city_code : undefined,
    country: 'country' in item ? item.country : undefined,
    location: 'location' in item ? item.location : undefined,
    population: 'population' in item ? item.population : undefined,
    source_quality: 'source_quality' in item ? item.source_quality : undefined,
    level_of_detail: 'level_of_detail' in item ? item.level_of_detail : undefined,
    special_demand: 'special_demand' in item ? item.special_demand : undefined,
  };
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
  const assetType = type === 'mods' ? 'mod' : 'map';
  const authorHref = getAuthorAttributionHref(item);
  const external = isExternalHref(authorHref);

  const registryAccent = getModeHex(
    PROJECT_COLOR_SCHEMES.registry.accentColor,
    isDark,
  );
  const registryText = getModeHex(
    PROJECT_COLOR_SCHEMES.registry.textColorInverted,
    isDark,
  );

  const renderActions: ReactNode = versionsLoading ? (
    <Button size="sm" isDisabled>
      Loading...
    </Button>
  ) : latestVersion ? (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        className="!bg-[var(--suite-accent-light)] !text-[var(--suite-text-inverted-light)] border-transparent hover:!brightness-90 dark:!bg-[var(--suite-accent-dark)] dark:!text-[var(--suite-text-inverted-dark)]"
        onPress={() => {
          window.location.href = `railyard://open?type=${encodeURIComponent(type)}&id=${encodeURIComponent(item.id)}`;
        }}
      >
        <Download className="h-4 w-4" />
        Open in Railyard
      </Button>
      <Button
        size="sm"
        className="border-transparent hover:!brightness-95"
        style={{ backgroundColor: registryAccent, color: registryText }}
        onPress={() => {
          window.location.href = `/registry/${type}/${encodeURIComponent(item.id)}`;
        }}
      >
        <ChartLine className="h-4 w-4" />
        View Analytics
      </Button>
    </div>
  ) : null;

  return (
    <SharedProjectHeader
      type={assetType}
      item={toSharedItem(item)}
      totalDownloads={totalDownloads}
      renderImage={(imagePath, className) => (
        <GalleryImage
          type={assetType}
          id={item.id}
          imagePath={imagePath}
          className={className}
        />
      )}
      renderAuthorLink={(children) => (
        <a
          href={authorHref}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="inline-flex min-w-0 max-w-full items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {children}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}
      renderSourceLink={(href, children) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          {children}
        </a>
      )}
      renderActions={versionsLoading || latestVersion ? renderActions : undefined}
    />
  );
}

