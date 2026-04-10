import { ItemCard as SharedItemCard } from '@subway-builder-modded/asset-listings-ui';
import { useMemo } from 'react';
import { Link } from 'wouter';

import type { AssetType } from '@/lib/asset-types';
import { assetTypeToListingPath } from '@/lib/asset-types';
import { formatListingDescriptionPreview } from '@/lib/description-preview';

import type { types } from '../../../wailsjs/go/models';
import { AuthorName } from './AuthorName';
import { GalleryImage } from './GalleryImage';

interface ItemCardWrapperProps {
  type: AssetType;
  item: types.ModManifest | types.MapManifest;
  installedVersion?: string;
  totalDownloads?: number;
  viewMode?: 'full' | 'compact' | 'list';
  descriptionMode?: 'raw' | 'preview';
}

function isMapManifest(
  item: types.ModManifest | types.MapManifest,
): item is types.MapManifest {
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

  const formatDescription = useMemo(() => {
    if (descriptionMode === 'preview') {
      return (desc: string) => formatListingDescriptionPreview(desc);
    }
    return undefined;
  }, [descriptionMode]);

  return (
    <SharedItemCard
      type={type === 'map' ? 'map' : 'mod'}
      id={item.id}
      name={item.name}
      author={{
        author_alias: item.author.author_alias,
        contributor_tier: item.author.contributor_tier,
      }}
      gallery={item.gallery}
      description={item.description}
      city_code={isMap ? (item as types.MapManifest).city_code : undefined}
      country={isMap ? (item as types.MapManifest).country : undefined}
      location={isMap ? (item as types.MapManifest).location : undefined}
      source_quality={
        isMap ? (item as types.MapManifest).source_quality : undefined
      }
      level_of_detail={
        isMap ? (item as types.MapManifest).level_of_detail : undefined
      }
      special_demand={
        isMap ? (item as types.MapManifest).special_demand : undefined
      }
      tags={!isMap ? (item as types.ModManifest).tags : undefined}
      population={isMap ? (item as types.MapManifest).population : undefined}
      installedVersion={installedVersion}
      totalDownloads={totalDownloads}
      viewMode={viewMode}
      href={`/project/${assetTypeToListingPath(type)}/${item.id}`}
      imagePath={item.gallery?.[0]}
      formatDescription={formatDescription}
      renderImage={({ type, id, imagePath, className }) => (
        <GalleryImage
          type={type as AssetType}
          id={id}
          imagePath={imagePath}
          className={className}
        />
      )}
      renderLink={({ href, children }) => (
        <Link
          href={href}
          className="block w-full no-underline text-inherit hover:no-underline"
        >
          {children}
        </Link>
      )}
      renderAuthorName={({ name, contributorTier, size }) => (
        <AuthorName name={name} contributorTier={contributorTier} size={size} />
      )}
    />
  );
}
