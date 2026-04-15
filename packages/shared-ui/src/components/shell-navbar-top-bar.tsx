import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type ShellNavbarTopBarProps = {
  /** Left-zone content. Use a fixed-width wrapper for symmetric centering in expanded mode. */
  left: ReactNode;
  /** Center content, horizontally centered in remaining space. */
  center?: ReactNode;
  /** Right-zone content. Use a fixed-width wrapper for symmetric centering in expanded mode. */
  right: ReactNode;
  className?: string;
};

/**
 * Generic three-column flex layout for shell navbar top bars.
 *
 * Left and right zones are `shrink-0` — they take their natural width (or a
 * fixed-width wrapper if passed by the consumer). The center zone is `flex-1`
 * and centers its content. For true symmetric centering, wrap left and right
 * children in equal-width divs (typical for expanded mode with a fixed dropdown
 * and matching actions zone).
 *
 * Fills the height of its parent (`h-full`). Set `h-12` or similar on the
 * parent to control the bar height.
 */
export function ShellNavbarTopBar({
  left,
  center,
  right,
  className,
}: ShellNavbarTopBarProps) {
  return (
    <div className={cn('flex h-full items-center', className)}>
      <div className="flex h-full shrink-0 items-center">{left}</div>
      {center !== undefined ? (
        <div className="flex min-w-0 flex-1 items-center justify-center">{center}</div>
      ) : null}
      <div className="flex h-full shrink-0 items-center">{right}</div>
    </div>
  );
}
