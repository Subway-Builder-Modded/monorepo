import { GalleryImageDisplay } from '@sbm/shared/railyard-ui/shared/gallery-image-display';

import { useGalleryImage } from '../../hooks/use-gallery-image';
import type { AssetType } from '../../lib/asset-types';

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
  const { imageUrl, loading, error } = useGalleryImage(type, id, imagePath);
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

