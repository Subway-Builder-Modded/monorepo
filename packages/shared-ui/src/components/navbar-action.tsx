import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const NAVBAR_ACTION_CLASS =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function NavbarActionButton({ className, ...props }: ComponentProps<'button'>) {
  return <button {...props} className={cn(NAVBAR_ACTION_CLASS, className)} />;
}

export function NavbarActionLink({ className, ...props }: ComponentProps<'a'>) {
  return <a {...props} className={cn(NAVBAR_ACTION_CLASS, className)} />;
}

export function NavbarActionGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex h-full items-center justify-end gap-1', className)} />;
}