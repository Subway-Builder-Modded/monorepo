import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

type NavbarPanelSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  accentColor: string;
  mutedColor: string;
};

type NavbarPanelGridProps = HTMLAttributes<HTMLUListElement> & {
  itemCount: number;
  children: ReactNode;
};

export function NavbarPanelSurface({
  accentColor,
  mutedColor,
  className,
  children,
  ...props
}: NavbarPanelSurfaceProps) {
  return (
    <div
      {...props}
      className={cn('pb-1 pt-0.5', className)}
      style={
        {
          ['--nav-accent' as string]: accentColor,
          ['--nav-muted' as string]: mutedColor,
        } as CSSProperties
      }
    >
      <div className="relative rounded-xl bg-foreground/[0.03] p-2 dark:bg-muted/20">{children}</div>
    </div>
  );
}

export function NavbarPanelGrid({ itemCount, className, children, ...props }: NavbarPanelGridProps) {
  const gridClassName =
    itemCount <= 1
      ? 'grid grid-cols-1 gap-2 max-w-[24rem]'
      : 'grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

  return (
    <ul {...props} role="list" className={cn(gridClassName, className)}>
      {children}
    </ul>
  );
}