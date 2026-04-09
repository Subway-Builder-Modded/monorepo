'use client';

import {
  GalleryImage as SharedGalleryImage,
  type GalleryImageProps as SharedGalleryImageProps,
} from '@subway-builder-modded/asset-listings-ui';

import { useGalleryImage } from '@/hooks/use-gallery-image';

interface GalleryImageProps extends Omit<
  SharedGalleryImageProps,
  'type' | 'imageUrl' | 'loading' | 'error' | 'resolveImageUrl'
> {
  type: 'mods' | 'maps';
}

export function GalleryImage({
  type,
  id,
  imagePath,
  ...props
}: GalleryImageProps) {
  const { imageUrl, loading, error } = useGalleryImage(type, id, imagePath);

  return (
    <SharedGalleryImage
      type={type === 'mods' ? 'mod' : 'map'}
      id={id}
      imagePath={imagePath}
      imageUrl={imageUrl}
      loading={loading}
      error={error}
      {...props}
    />
  );
}
