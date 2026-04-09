'use client';

import { GalleryImageDisplay } from '@sbm/core/railyard/ui/shared/gallery-image-display';

import { useGalleryImage } from '../../../hooks/use-gallery-image';
import type { AssetType } from '../../../lib/railyard/asset-types';

interface GalleryImageProps {
  type: AssetType;
  id: string;
  imagePath?: string;
  className?: string;
  fallbackIconClassName?: string;
}

export function GalleryImage({
  type,
  id,
  imagePath,
  className,
  fallbackIconClassName,
}: GalleryImageProps) {
  const listingType = type === 'mod' ? 'mods' : 'maps';
  const { imageUrl, loading, error } = useGalleryImage(listingType, id, imagePath);
  return (
    <GalleryImageDisplay
      type={type}
      src={imageUrl}
      loading={loading}
      error={error}
      className={className}
      fallbackIconClassName={fallbackIconClassName}
    />
  );
}
