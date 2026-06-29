import { cn } from '@subway-builder-modded/shared-ui';
import { CircleAlert, FlaskConical, HardDrive } from 'lucide-react';
import type { ElementType } from 'react';

const BADGE_BASE_CLASS =
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest';

function StatusBadge({
  icon: Icon,
  label,
  colorClassName,
  className,
}: {
  icon: ElementType;
  label: string;
  colorClassName: string;
  className?: string;
}) {
  return (
    <span className={cn(BADGE_BASE_CLASS, colorClassName, className)}>
      <Icon className="h-2.5 w-2.5 shrink-0" />
      {label}
    </span>
  );
}

export function LocalBadge({ className }: { className?: string }) {
  return (
    <StatusBadge
      icon={HardDrive}
      label="Local"
      colorClassName="border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      className={className}
    />
  );
}

export function IncompatibleBadge({ className }: { className?: string }) {
  return (
    <StatusBadge
      icon={CircleAlert}
      label="Incompatible"
      colorClassName="border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-400"
      className={className}
    />
  );
}

export function TestBadge({ className }: { className?: string }) {
  return (
    <StatusBadge
      icon={FlaskConical}
      label="Test"
      colorClassName="border-[color-mix(in_srgb,var(--update-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--update-primary)_10%,transparent)] text-(--update-primary)"
      className={className}
    />
  );
}
