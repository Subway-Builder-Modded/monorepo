'use client';

import { Slot } from 'radix-ui';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';
import { Button, type ButtonProps } from './button';
import { Separator } from './separator';
import { cn } from '../lib/cn';

type NavbarContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  toggleNavbar: () => void;
};

const NavbarContext = React.createContext<NavbarContextValue | null>(null);

function useMobileBreakpoint(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setIsMobile(media.matches);

    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    if (typeof media.addListener === 'function') {
      media.addListener(update);
      return () => media.removeListener(update);
    }

    return;
  }, [breakpointPx]);

  return isMobile;
}

export function useNavbar() {
  const context = React.useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within NavbarProvider.');
  }

  return context;
}

export type NavbarProviderProps = React.ComponentProps<'div'> & {
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function NavbarProvider({
  defaultOpen = false,
  isOpen,
  onOpenChange,
  className,
  children,
  ...props
}: NavbarProviderProps) {
  const [openInternal, setOpenInternal] = React.useState(defaultOpen);
  const open = isOpen ?? openInternal;

  const setOpen = React.useCallback<NavbarContextValue['setOpen']>(
    (value) => {
      const next = typeof value === 'function' ? value(open) : value;
      if (onOpenChange) {
        onOpenChange(next);
        return;
      }

      setOpenInternal(next);
    },
    [onOpenChange, open],
  );

  const isMobile = useMobileBreakpoint();
  const toggleNavbar = React.useCallback(() => setOpen((prev) => !prev), [setOpen]);

  const contextValue = React.useMemo<NavbarContextValue>(
    () => ({
      open,
      setOpen,
      isMobile,
      toggleNavbar,
    }),
    [open, setOpen, isMobile, toggleNavbar],
  );

  return (
    <NavbarContext.Provider value={contextValue}>
      <div
        className={twMerge(
          'peer/navbar group/navbar relative isolate z-50 flex w-full flex-col',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </NavbarContext.Provider>
  );
}

export type NavbarProps = React.ComponentProps<'div'> & {
  isSticky?: boolean;
  placement?: 'top' | 'bottom';
};

export function Navbar({
  isSticky = false,
  placement = 'top',
  className,
  children,
  ...props
}: NavbarProps) {
  const { isMobile, open, setOpen } = useNavbar();

  if (isMobile) {
    return (
      <>
        <div data-navbar-sticky={isSticky ? '' : undefined} data-placement={placement} className="hidden" />
        {open ? (
          <div className="fixed inset-0 z-50 md:hidden" aria-label="Mobile Navbar" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[min(88vw,22rem)] overflow-y-auto border-r border-border bg-background p-3 shadow-xl">
              {children}
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div
      data-navbar-sticky={isSticky ? '' : undefined}
      data-placement={placement}
      className={twMerge(
        'relative isolate',
        isSticky &&
          (placement === 'bottom'
            ? 'fixed inset-x-0 bottom-0 z-50'
            : 'fixed inset-x-0 top-3 z-50'),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function NavbarShell({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navbar-shell"
      className={twMerge(
        'flex min-h-[4rem] flex-wrap items-center justify-between gap-y-2 rounded-2xl border border-border/70 bg-background/90 px-[clamp(0.8rem,2vw,1.4rem)] py-1.5 shadow-sm backdrop-blur-md',
        className,
      )}
      {...props}
    />
  );
}

export function NavbarSection({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navbar-section"
      className={twMerge('flex min-w-0 flex-wrap items-center gap-1.5', className)}
      {...props}
    />
  );
}

export function NavbarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <NavbarSection className={className} {...props} />;
}

export function NavbarStart({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={twMerge('relative', className)} {...props} />;
}

export function NavbarSpacer({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={twMerge('flex-1', className)} {...props} />;
}

export function NavbarGap({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={twMerge('mx-2', className)} {...props} />;
}

export function NavbarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator orientation="vertical" className={twMerge('h-5', className)} {...props} />;
}

export type NavbarItemProps = React.ComponentProps<'button'> & {
  isActive?: boolean;
  asChild?: boolean;
};

export function NavbarItem({ className, isActive, asChild = false, children, ...props }: NavbarItemProps) {
  const Comp = asChild ? Slot.Root : 'button';

  if (asChild) {
    return (
      <Comp
        data-slot="navbar-item"
        data-active={isActive ? 'true' : 'false'}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative inline-flex min-w-0 items-center justify-center gap-[var(--app-navbar-item-gap,0.28rem)] rounded-[var(--app-navbar-item-radius,0.54rem)] px-[var(--app-navbar-item-px,0.42rem)] py-[var(--app-navbar-item-py,0.3rem)] text-[var(--app-navbar-item-title,0.68rem)] font-semibold text-muted-fg no-underline outline-none transition-all duration-200 ease-[cubic-bezier(.22,.9,.35,1)]',
          'hover:bg-accent/45 hover:text-primary active:bg-accent/55 data-[active=true]:bg-accent/45 data-[active=true]:text-primary',
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="navbar-item"
      data-active={isActive ? 'true' : 'false'}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative inline-flex min-w-0 items-center justify-center gap-[var(--app-navbar-item-gap,0.28rem)] rounded-[var(--app-navbar-item-radius,0.54rem)] px-[var(--app-navbar-item-px,0.42rem)] py-[var(--app-navbar-item-py,0.3rem)] text-[var(--app-navbar-item-title,0.68rem)] font-semibold text-muted-fg no-underline outline-none transition-all duration-200 ease-[cubic-bezier(.22,.9,.35,1)]',
        'hover:bg-accent/45 hover:text-primary active:bg-accent/55 data-[active=true]:bg-accent/45 data-[active=true]:text-primary',
        className,
      )}
      {...props}
    >
      {children}
      <ActiveRouteIndicator isActive={Boolean(isActive)} />
    </Comp>
  );
}

export function NavbarLabel({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="navbar-label" className={twMerge('truncate', className)} {...props} />;
}

export type NavbarBrandBlockProps = React.ComponentProps<'a'> & {
  asChild?: boolean;
};

export function NavbarBrandBlock({ className, asChild = false, ...props }: NavbarBrandBlockProps) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot="navbar-brand"
      className={twMerge(
        'group flex min-w-0 items-center text-muted-fg no-underline transition-colors duration-150 ease-out gap-[var(--app-navbar-brand-gap,0rem)] rounded-[var(--app-navbar-item-radius,0.54rem)] px-[var(--app-navbar-item-px,0.42rem)] py-[var(--app-navbar-item-py,0.3rem)] hover:bg-accent/45 hover:text-primary',
        className,
      )}
      {...props}
    />
  );
}

export function NavbarActionsSlot({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="navbar-actions" className={twMerge('flex items-center gap-1.5', className)} {...props} />;
}

export function ActiveRouteIndicator({
  isActive,
  className,
  ...props
}: React.ComponentProps<'span'> & { isActive?: boolean }) {
  if (!isActive) {
    return null;
  }

  return (
    <span
      aria-hidden
      data-slot="active-route-indicator"
      className={twMerge(
        'absolute -bottom-[0.38rem] left-1/2 h-1 w-[calc(100%-1rem)] -translate-x-1/2 rounded-full bg-primary',
        className,
      )}
      {...props}
    />
  );
}

export function NavbarMobile({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navbar-mobile"
      className={twMerge(
        'z-50 flex items-center gap-x-2 px-4 py-2.5 md:hidden',
        'group-has-data-navbar-sticky/navbar:sticky group-has-data-navbar-sticky/navbar:top-0 group-has-data-navbar-sticky/navbar:border-b group-has-data-navbar-sticky/navbar:border-border/70 group-has-data-navbar-sticky/navbar:bg-background/90 group-has-data-navbar-sticky/navbar:shadow-sm group-has-data-navbar-sticky/navbar:backdrop-blur-md',
        className,
      )}
      {...props}
    />
  );
}

export function MobileNavigationShell({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="mobile-navigation-shell"
      className={twMerge('flex flex-col gap-2 md:hidden', className)}
      {...props}
    />
  );
}

export type NavbarTriggerProps = ButtonProps;

export function NavbarTrigger({ className, onClick, ...props }: NavbarTriggerProps) {
  const { toggleNavbar } = useNavbar();

  return (
    <Button
      data-slot="navbar-trigger"
      intent="plain"
      size="icon-sm"
      className={cn('-ms-2 lg:hidden', className)}
      aria-label={props['aria-label'] ?? 'Toggle Navbar'}
      onClick={(event) => {
        onClick?.(event);
        toggleNavbar();
      }}
      {...props}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="size-5">
        <path d="M3 5.75A.75.75 0 0 1 3.75 5h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.75Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" />
      </svg>
      <span className="sr-only">Toggle Navbar</span>
    </Button>
  );
}

export function NavbarInset({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navbar-inset"
      className={twMerge('flex flex-1 flex-col bg-sidebar pb-2 md:px-2 dark:bg-bg', className)}
      {...props}
    >
      <div className="grow bg-bg p-6 md:rounded-lg md:p-16 md:shadow-xs md:ring-1 md:ring-fg/15 md:dark:bg-sidebar md:dark:ring-border">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
