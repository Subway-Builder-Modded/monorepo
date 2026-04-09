import { MapPin, Package } from 'lucide-react';

import { Skeleton } from '@sbm/core/railyard/components/ui/skeleton';
import { useGalleryImage } from '@sbm/core/railyard/hooks/use-gallery-image';
import type { AssetType } from '@sbm/core/railyard/lib/asset-types';
import { cn } from '@sbm/core/railyard/lib/utils';

interface GalleryImageProps {
  type: AssetType;
  id: string;
  imagePath?: string;
  className?: string;
  /** Override the fallback icon size. Defaults to `h-12 w-12`. */
  fallbackIconClassName?: string;
}

export function GalleryImage({
  type,
  id,
  imagePath,
  className,
  fallbackIconClassName = 'h-12 w-12',
}: GalleryImageProps) {
  const { imageUrl, loading, error } = useGalleryImage(type, id, imagePath);
  const FallbackIcon = type === 'mod' ? Package : MapPin;

  if (loading) {
    return <Skeleton className={cn('w-full', className)} />;
  }

  if (!imageUrl || error) {
    return (
      <div
        className={cn(
          'w-full flex items-center justify-center bg-muted',
          className,
        )}
      >
        <FallbackIcon
          className={cn('text-muted-foreground', fallbackIconClassName)}
        />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt=""
      className={cn('w-full object-cover', className)}
    />
  );
}
