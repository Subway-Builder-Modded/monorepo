import { ImageChip } from '@subway-builder-modded/asset-listings-ui';
import { cn } from '@subway-builder-modded/shared-ui';
import { CircleAlert, FlaskConical, HardDrive } from 'lucide-react';

export function LocalBadge({ className }: { className?: string }) {
  return (
    <ImageChip
      className={cn(
        'border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        className,
      )}
    >
      <HardDrive className="h-2.5 w-2.5 shrink-0" />
      Local
    </ImageChip>
  );
}

export function IncompatibleBadge({ className }: { className?: string }) {
  return (
    <ImageChip
      className={cn(
        'border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-400',
        className,
      )}
    >
      <CircleAlert className="h-2.5 w-2.5 shrink-0" />
      Incompatible
    </ImageChip>
  );
}

export function TestBadge({ className }: { className?: string }) {
  return (
    <ImageChip
      className={cn(
        'border-[color-mix(in_srgb,var(--update-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--update-primary)_10%,transparent)] text-(--update-primary)',
        className,
      )}
    >
      <FlaskConical className="h-2.5 w-2.5 shrink-0" />
      Test
    </ImageChip>
  );
}
