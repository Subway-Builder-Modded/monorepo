import { assetTypeToListingPath } from '@sbm/shared/railyard-core/asset-types';
import type { SharedItemData } from '@sbm/shared/railyard-core/shared-item';
import {
  ItemCard as SharedItemCard,
} from '@sbm/shared/railyard-ui/shared/item-card';
import { Link } from 'wouter';

import type { AssetType } from '../../lib/asset-types';
import type { SearchViewMode } from '../../lib/search-view-mode';

import type { types } from '@railyard-app/wailsjs/go/models';
import { GalleryImage } from './GalleryImage';

interface ItemCardProps {
  type: AssetType;
  item: types.ModManifest | types.MapManifest;
  installedVersion?: string;
  totalDownloads?: number;
  viewMode?: SearchViewMode;
  descriptionMode?: 'raw' | 'preview';
}

function toSharedItemData(item: types.ModManifest | types.MapManifest): SharedItemData {
  const isMap = 'city_code' in item;
  const m = isMap ? (item as types.MapManifest) : null;
  return {
    id: item.id,
    name: item.name,
    author: {
      display_name: item.author.author_alias,
      contributor_tier: item.author.contributor_tier,
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

export function ItemCard({ type, item, installedVersion, totalDownloads, viewMode, descriptionMode }: ItemCardProps) {
  const shared = toSharedItemData(item);
  const href = `/project/${assetTypeToListingPath(type)}/${item.id}`;

  return (
    <SharedItemCard
      type={type}
      item={shared}
      href={href}
      installedVersion={installedVersion}
      totalDownloads={totalDownloads}
      viewMode={viewMode}
      descriptionMode={descriptionMode}
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

