import { MapPin, Package } from 'lucide-react';
import type { AssetType } from '@sbm/shared/railyard-core/asset-types';
import { cx } from './cx';

interface GalleryImageDisplayProps {
  type: AssetType;
  src: string | null | undefined;
  loading?: boolean;
  error?: boolean;
  className?: string;
  fallbackIconClassName?: string;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'animate-pulse rounded-md bg-muted',
        className,
      )}
    />
  );
}

export function GalleryImageDisplay({
  type,
  src,
  loading = false,
  error = false,
  className,
  fallbackIconClassName = 'h-12 w-12',
}: GalleryImageDisplayProps) {
  const FallbackIcon = type === 'mod' ? Package : MapPin;

  if (loading) {
    return <Skeleton className={cx('w-full', className)} />;
  }

  if (!src || error) {
    return (
      <div
        className={cx(
          'w-full flex items-center justify-center bg-muted',
          className,
        )}
      >
        <FallbackIcon
          className={cx('text-muted-foreground', fallbackIconClassName)}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cx('w-full object-cover', className)}
    />
  );
}

