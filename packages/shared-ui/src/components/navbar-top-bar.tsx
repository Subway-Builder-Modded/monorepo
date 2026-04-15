import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type NavbarTopBarProps = {
  left: ReactNode;
  center?: ReactNode;
  right: ReactNode;
  className?: string;
  leftClassName?: string;
  centerClassName?: string;
  rightClassName?: string;
  centerStyle?: CSSProperties;
  overlayCenter?: boolean;
};

export function NavbarTopBar({
  left,
  center,
  right,
  className,
  leftClassName,
  centerClassName,
  rightClassName,
  centerStyle,
  overlayCenter = false,
}: NavbarTopBarProps) {
  return (
    <div className={cn('relative flex h-full items-center', className)}>
      <div className={cn('flex h-full shrink-0 items-center', leftClassName)}>{left}</div>
      {center !== undefined && !overlayCenter ? (
        <div className={cn('flex min-w-0 flex-1 items-center justify-center', centerClassName)}>
          {center}
        </div>
      ) : null}
      <div className={cn('ml-auto flex h-full shrink-0 items-center justify-end', rightClassName)}>
        {right}
      </div>

      {center !== undefined && overlayCenter ? (
        <div className="pointer-events-none absolute inset-0 flex h-full items-center justify-center">
          <div className={cn('min-w-0', centerClassName)} style={centerStyle}>
            {center}
          </div>
        </div>
      ) : null}
    </div>
  );
}