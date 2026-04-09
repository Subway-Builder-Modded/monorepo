import { Skeleton, cn } from '@subway-builder-modded/shared-ui';
import { MapPin, Package } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { GalleryAssetType } from '../types';

export interface GalleryImageProps {
  type: GalleryAssetType;
  id: string;
  imagePath?: string;
  className?: string;
  fallbackIconClassName?: string;
  imageUrl?: string | null;
  loading?: boolean;
  error?: boolean;
  resolveImageUrl?: (
    type: GalleryAssetType,
    id: string,
    imagePath?: string,
  ) => string | null | undefined | Promise<string | null | undefined>;
}

export function GalleryImage({
  type,
  id,
  imagePath,
  className,
  fallbackIconClassName = 'h-12 w-12',
  imageUrl: controlledImageUrl,
  loading: controlledLoading,
  error: controlledError,
  resolveImageUrl,
}: GalleryImageProps) {
  const [uncontrolledImageUrl, setUncontrolledImageUrl] = useState<string | null>(null);
  const [uncontrolledLoading, setUncontrolledLoading] = useState(Boolean(resolveImageUrl));
  const [uncontrolledError, setUncontrolledError] = useState(false);

  const FallbackIcon = useMemo(() => (type === 'mod' ? Package : MapPin), [type]);

  useEffect(() => {
    let cancelled = false;

    if (!resolveImageUrl) {
      setUncontrolledImageUrl(null);
      setUncontrolledLoading(false);
      setUncontrolledError(false);
      return;
    }

    setUncontrolledLoading(true);
    setUncontrolledError(false);

    Promise.resolve(resolveImageUrl(type, id, imagePath))
      .then((url) => {
        if (cancelled) return;
        setUncontrolledImageUrl(url ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setUncontrolledImageUrl(null);
        setUncontrolledError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setUncontrolledLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolveImageUrl, type, id, imagePath]);

  const imageUrl = controlledImageUrl ?? uncontrolledImageUrl;
  const loading = controlledLoading ?? uncontrolledLoading;
  const error = controlledError ?? uncontrolledError;

  if (loading) {
    return <Skeleton className={cn('w-full', className)} />;
  }

  if (!imageUrl || error) {
    return (
      <div className={cn('w-full flex items-center justify-center bg-muted', className)}>
        <FallbackIcon
          className={cn('text-muted-foreground', fallbackIconClassName)}
        />
      </div>
    );
  }

  return <img src={imageUrl} alt="" className={cn('w-full object-cover', className)} />;
}
