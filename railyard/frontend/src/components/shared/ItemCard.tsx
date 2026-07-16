import {
  formatListingDescriptionPreview,
  ItemCard as SharedItemCard,
} from '@subway-builder-modded/asset-listings-ui';
import type { AssetType } from '@subway-builder-modded/config';
import {
  assetTypeToListingPath,
  resolveMapLocation,
} from '@subway-builder-modded/config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@subway-builder-modded/shared-ui';
import { memo, useEffect, useMemo } from 'react';
import { Link } from 'wouter';

import { getCountryFlagIcon } from '@/lib/flags';
import { countRenders } from '@/lib/perf';

import type { types } from '../../../wailsjs/go/models';
import { IncompatibleBadge, TestBadge } from './AssetStatusBadges';
import { AuthorName } from './AuthorName';
import { GalleryImage } from './GalleryImage';

interface ItemCardWrapperProps {
  type: AssetType;
  item: types.ModManifest | types.MapManifest;
  installedVersion?: string;
  totalDownloads?: number;
  incompatible?: boolean;
  gameVersion?: string;
  test?: boolean;
  viewMode?: 'full' | 'compact' | 'list';
  descriptionMode?: 'raw' | 'preview';
}

function isMapManifest(
  item: types.ModManifest | types.MapManifest,
): item is types.MapManifest {
  return 'city_code' in item;
}

// Memoized so a parent re-render (filter/search/selection change on a page full of cards) only
// re-renders the cards whose props actually changed, not the whole grid.
function ItemCardComponent({
  type,
  item,
  installedVersion,
  totalDownloads,
  incompatible = false,
  gameVersion,
  test = false,
  viewMode = 'full',
  descriptionMode = 'raw',
}: ItemCardWrapperProps) {
  // Counts committed renders (skipped renders from memo aren't counted) to measure fan-out.
  useEffect(() => {
    countRenders('itemCard');
  });

  const isMap = isMapManifest(item);
  const mapItem = isMap ? (item as types.MapManifest) : null;
  const CountryFlag = getCountryFlagIcon(mapItem?.country);
  // Browse only knows that no downloadable version is compatible (versions can fail
  // for different reasons), so the hover is a single statement rather than per-reason rows.
  const incompatibleReason = gameVersion
    ? `No asset version is compatible with game version ${gameVersion}.`
    : 'No compatible asset version available.';

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
        CountryFlag && <CountryFlag className="h-3.5 w-5 rounded-[1px]" />
      }
      location={mapItem ? resolveMapLocation(mapItem) : undefined}
      source_quality={mapItem?.source_quality}
      level_of_detail={mapItem?.level_of_detail}
      special_demand={mapItem?.special_demand}
      tags={!isMap ? (item as types.ModManifest).tags : undefined}
      population={mapItem?.population}
      installedVersion={installedVersion}
      totalDownloads={totalDownloads}
      topLeftBadge={
        incompatible || test ? (
          <span className="inline-flex items-center gap-1">
            {test && <TestBadge />}
            {incompatible && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <IncompatibleBadge />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    {incompatibleReason}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        ) : undefined
      }
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

export const ItemCard = memo(ItemCardComponent);
