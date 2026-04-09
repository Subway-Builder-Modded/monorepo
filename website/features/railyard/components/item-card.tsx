'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { GalleryImage } from '@/features/railyard/components/gallery-image';
import { AuthorName } from '@/components/shared/author-name';
import {
  type AssetType,
  assetTypeToListingPath,
} from '@/lib/railyard/asset-types';
import type { SearchViewMode } from '@/lib/railyard/search-view-mode';
import type { MapManifest, ModManifest } from '@/types/registry';
import { ItemCard as SharedItemCard } from '@subway-builder-modded/asset-listings-ui';

interface ItemCardWrapperProps {
  type: AssetType;
  item: ModManifest | MapManifest;
  installedVersion?: string;
  totalDownloads?: number;
  viewMode?: SearchViewMode;
}

function isMapManifest(item: ModManifest | MapManifest): item is MapManifest {
  return 'city_code' in item;
}

export function ItemCard({
  type,
  item,
  installedVersion,
  totalDownloads,
  viewMode = 'full',
}: ItemCardWrapperProps) {
  const isMap = isMapManifest(item);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const href = `/railyard/${assetTypeToListingPath(type)}/${item.id}?from=${encodeURIComponent(from)}`;

  return (
    <SharedItemCard
      type={type === 'map' ? 'map' : 'mod'}
      id={item.id}
      name={item.name}
      author={{
        author_alias: item.author,
        contributor_tier: undefined,
      }}
      gallery={item.gallery}
      description={item.description}
      city_code={isMap ? (item as MapManifest).city_code : undefined}
      country={isMap ? (item as MapManifest).country : undefined}
      location={isMap ? (item as MapManifest).location : undefined}
      source_quality={isMap ? (item as MapManifest).source_quality : undefined}
      level_of_detail={
        isMap ? (item as MapManifest).level_of_detail : undefined
      }
      special_demand={isMap ? (item as MapManifest).special_demand : undefined}
      tags={!isMap ? (item as ModManifest).tags : undefined}
      population={isMap ? (item as MapManifest).population : undefined}
      installedVersion={installedVersion}
      totalDownloads={totalDownloads}
      viewMode={viewMode}
      href={href}
      imagePath={item.gallery?.[0]}
      renderImage={({ type, id, imagePath, className }) => (
        <GalleryImage
          type={type === 'mod' ? 'mods' : 'maps'}
          id={id}
          imagePath={imagePath}
          className={className}
        />
      )}
      renderLink={({ href, children }) => (
        <Link href={href} className="block w-full">
          {children}
        </Link>
      )}
      renderAuthorName={() => (
        <AuthorName
          author={item}
          className="min-w-0 max-w-full"
          nameClassName="truncate"
        />
      )}
    />
  );
}
