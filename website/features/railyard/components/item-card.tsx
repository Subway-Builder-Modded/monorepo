'use client';

import {
  formatListingDescriptionPreview,
  ItemCard as SharedItemCard,
} from '@subway-builder-modded/asset-listings-ui';
import type { SearchViewMode } from '@subway-builder-modded/config';
import {
  type AssetType,
  assetTypeToListingPath,
} from '@subway-builder-modded/config';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { GalleryImage } from '@/features/railyard/components/gallery-image';
import { AuthorName } from '@/components/shared/author-name';
import type { MapManifest, ModManifest } from '@/types/registry';

interface ItemCardWrapperProps {
  type: AssetType;
  item: ModManifest | MapManifest;
  installedVersion?: string;
  totalDownloads?: number;
  viewMode?: SearchViewMode;
  descriptionMode?: 'raw' | 'preview';
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
  descriptionMode = 'raw',
}: ItemCardWrapperProps) {
  const isMap = isMapManifest(item);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formatDescription = useMemo(() => {
    if (descriptionMode === 'preview') {
      return (description: string) =>
        formatListingDescriptionPreview(description);
    }

    return undefined;
  }, [descriptionMode]);
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
      formatDescription={formatDescription}
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
