import { ImageChip } from '@subway-builder-modded/asset-listings-ui';
import { cn } from '@subway-builder-modded/shared-ui';
import {
  Archive,
  CircleAlert,
  FlaskConical,
  HardDrive,
  Trash2,
} from 'lucide-react';

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

// Not red: retirement is an author decision, not a defect.
export function DeprecatedBadge({ className }: { className?: string }) {
  return (
    <ImageChip
      className={cn(
        'border-slate-400/40 bg-slate-400/15 text-slate-600 dark:text-slate-300',
        className,
      )}
    >
      <Archive className="h-2.5 w-2.5 shrink-0" />
      Deprecated
    </ImageChip>
  );
}

// See DeprecatedBadge; deletion is the permanent variant.
export function DeletedBadge({ className }: { className?: string }) {
  return (
    <ImageChip
      className={cn(
        'border-zinc-700/60 bg-zinc-700/25 text-zinc-800 dark:border-zinc-300/40 dark:bg-zinc-300/15 dark:text-zinc-200',
        className,
      )}
    >
      <Trash2 className="h-2.5 w-2.5 shrink-0" />
      Deleted
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
