import { cn } from '@subway-builder-modded/shared-ui';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className,
      )}
    >
      <Icon
        className={cn('mb-4 h-12 w-12 text-muted-foreground', iconClassName)}
        aria-hidden="true"
      />
      <h3 className={cn('text-lg font-medium', titleClassName)}>{title}</h3>
      {description && (
        <p className={cn('mt-1 max-w-sm text-sm text-muted-foreground', descriptionClassName)}>
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
