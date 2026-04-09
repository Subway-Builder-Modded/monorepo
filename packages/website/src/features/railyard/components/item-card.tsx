'use client';

import {
  ItemCard as SharedItemCard,
} from '@sbm/core/railyard/ui/shared/item-card';
import type { SharedItemData } from '@sbm/core/railyard/core/shared-item';
import { assetTypeToListingPath } from '@sbm/core/railyard/core/asset-types';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import type { AssetType } from '../../../lib/railyard/asset-types';
import type { SearchViewMode } from '../../../lib/railyard/search-view-mode';
import type { MapManifest, ModManifest } from '../../../types/registry';

import { GalleryImage } from './gallery-image';

interface ItemCardProps {
  type: AssetType;
  item: ModManifest | MapManifest;
  installedVersion?: string;
  totalDownloads?: number;
  viewMode?: SearchViewMode;
}

function isMapManifest(item: ModManifest | MapManifest): item is MapManifest {
  return 'city_code' in item;
}

function toSharedItemData(item: ModManifest | MapManifest): SharedItemData {
  const isMap = isMapManifest(item);
  const m = isMap ? item : null;
  return {
    id: item.id,
    name: item.name,
    author: {
      display_name: item.author_alias ?? item.author,
      contributor_tier: item.contributor_tier,
    },
    description: item.description,
    tags: item.tags,
    gallery: item.gallery,
    city_code: m?.city_code,
    country: m?.country,
    location: m?.location,
    population: m?.population,
    source_quality: m?.source_quality,
    level_of_detail: m?.level_of_detail,
    special_demand: m?.special_demand,
  };
}

export function ItemCard({
  type,
  item,
  installedVersion,
  totalDownloads,
  viewMode,
}: ItemCardProps) {
  const shared = toSharedItemData(item);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const href = `/railyard/${assetTypeToListingPath(type)}/${item.id}?from=${encodeURIComponent(from)}`;

  return (
    <SharedItemCard
      type={type}
      item={shared}
      href={href}
      installedVersion={installedVersion}
      totalDownloads={totalDownloads}
      viewMode={viewMode}
      descriptionMode="preview"
      renderLink={(h, children, className) => (
        <Link href={h} className={className}>
          {children}
        </Link>
      )}
      renderImage={(imagePath, className) => (
        <GalleryImage type={type} id={item.id} imagePath={imagePath} className={className} />
      )}
    />
  );
}
