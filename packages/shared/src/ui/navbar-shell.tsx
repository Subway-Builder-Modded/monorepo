import { Slot as SlotPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../shared/cx';

function NavbarShell({
  asChild,
  className,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Root : 'div';
  return (
    <Comp
      data-slot="navbar-shell"
      className={cn(
        'min-h-[4rem] flex-wrap justify-between rounded-2xl border border-border/70 bg-background/90 px-[clamp(0.7rem,1.6vw,1.2rem)] py-1.5 shadow-sm backdrop-blur-md',
        className,
      )}
      {...props}
    />
  );
}

function NavbarBrand({
  asChild,
  className,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Root : 'div';
  return (
    <Comp
      data-slot="navbar-brand"
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[clamp(1rem,1.55vw,1.15rem)] font-extrabold tracking-[0.01em] text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function NavbarNav({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      data-slot="navbar-nav"
      className={cn('flex max-w-full flex-wrap items-center gap-1.5', className)}
      {...props}
    />
  );
}

function NavbarActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navbar-actions"
      className={cn('flex items-center gap-1.5', className)}
      {...props}
    />
  );
}

function NavbarItem({
  asChild,
  className,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Root : 'div';
  return (
    <Comp
      data-slot="navbar-item"
      className={cn(
        'group relative flex items-center gap-2 rounded-lg px-[clamp(0.45rem,0.95vw,0.7rem)] py-[clamp(0.4rem,0.82vw,0.56rem)] text-[clamp(0.8rem,0.95vw,0.9rem)] font-semibold text-muted-foreground transition-all duration-150',
        className,
      )}
      {...props}
    />
  );
}

const navbarInteractiveAccentClass = 'hover:text-primary hover:bg-accent/45';
const navbarCurrentIndicatorClass =
  'absolute -bottom-[0.38rem] left-1/2 h-1 w-[calc(100%-1rem)] -translate-x-1/2 rounded-full bg-primary';
const sharedNavbarStickyShellClass =
  'min-h-[4rem] flex-wrap justify-between rounded-2xl border border-border/70 bg-background/90 px-[clamp(0.7rem,1.6vw,1.2rem)] py-1.5 shadow-sm backdrop-blur-md';
const sharedNavbarBrandClass =
  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[clamp(1rem,1.55vw,1.15rem)] font-extrabold tracking-[0.01em] text-foreground';
const sharedNavbarItemClass =
  'group relative flex items-center gap-2 rounded-lg px-[clamp(0.45rem,0.95vw,0.7rem)] py-[clamp(0.4rem,0.82vw,0.56rem)] text-[clamp(0.8rem,0.95vw,0.9rem)] font-semibold text-muted-foreground transition-all duration-150';
const sharedNavbarInteractiveAccentClass = navbarInteractiveAccentClass;
const sharedNavbarCurrentIndicatorClass = navbarCurrentIndicatorClass;

export {
  NavbarShell,
  NavbarBrand,
  NavbarNav,
  NavbarActions,
  NavbarItem,
  navbarInteractiveAccentClass,
  navbarCurrentIndicatorClass,
  sharedNavbarStickyShellClass,
  sharedNavbarBrandClass,
  sharedNavbarItemClass,
  sharedNavbarInteractiveAccentClass,
  sharedNavbarCurrentIndicatorClass,
};
