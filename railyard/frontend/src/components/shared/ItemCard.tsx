import {
  formatListingDescriptionPreview,
  ItemCard as SharedItemCard,
} from '@subway-builder-modded/asset-listings-ui';
import type { AssetType } from '@subway-builder-modded/config';
import { assetTypeToListingPath } from '@subway-builder-modded/config';
import { useMemo } from 'react';
import { Link } from 'wouter';

import { getCountryFlagIcon } from '@/lib/flags';

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
  const mapItem = isMap ? (item as types.MapManifest) : null;
  const CountryFlag = mapItem ? getCountryFlagIcon(mapItem.country) : null;

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
      city_code={mapItem?.city_code}
      country={mapItem?.country}
      countryFlag={
        CountryFlag ? (
          <CountryFlag className="h-3.5 w-5 rounded-[1px]" />
        ) : undefined
      }
      location={mapItem?.location}
      source_quality={mapItem?.source_quality}
      level_of_detail={mapItem?.level_of_detail}
      special_demand={mapItem?.special_demand}
      tags={!isMap ? (item as types.ModManifest).tags : undefined}
      population={mapItem?.population}
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
