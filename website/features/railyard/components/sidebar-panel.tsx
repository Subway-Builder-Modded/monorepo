'use client';

import {
  SidebarPanel as SharedSidebarPanel,
  type SidebarPanelProps as SharedSidebarPanelProps,
} from '@subway-builder-modded/asset-listings-ui';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { SearchFilterState } from '@/hooks/use-filtered-items';
import { cn } from '@subway-builder-modded/shared-ui';

const MOBILE_SIDEBAR_TOP = 'var(--app-navbar-offset, 5.5rem)';

function getNavbarOffsetPx(): number {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--app-navbar-offset',
      ),
    ) || 72
  );
}

export type SidebarPanelProps = SharedSidebarPanelProps<SearchFilterState> & {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

export function SidebarPanel({
  mobileOpen = false,
  onMobileOpenChange,
  ...props
}: SidebarPanelProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  if (isMobile === null) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet
        isOpen={mobileOpen}
        onOpenChange={onMobileOpenChange ?? (() => {})}
      >
        <SheetContent
          side="left"
          closeButton={false}
          isFloat={false}
          overlayClassName="bg-black/10 backdrop-blur-sm"
          className={cn(
            'railyard-accent',
            'inset-y-auto h-[calc(100svh-var(--browse-mobile-sidebar-top))]',
            'w-72 max-w-none bg-background p-0',
            'entering:duration-200 entering:ease-out exiting:duration-160 exiting:ease-in',
            '[&>button]:hidden',
          )}
          style={
            {
              '--browse-mobile-sidebar-top': MOBILE_SIDEBAR_TOP,
              top: MOBILE_SIDEBAR_TOP,
            } as CSSProperties
          }
          aria-label={props.ariaLabel}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Browse filters</SheetTitle>
            <SheetDescription>Filter browse results</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-[clamp(0.65rem,1.4vw,1rem)] py-[clamp(0.42rem,0.88vw,0.6rem)]">
              <div className="flex flex-1 items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-[clamp(0.78rem,0.92vw,0.88rem)] font-semibold text-muted-foreground">
                  Filters
                </span>
              </div>
              <button
                type="button"
                onClick={() => onMobileOpenChange?.(false)}
                aria-label="Close filters"
                className="mr-[-0.15rem] translate-x-0.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/45 hover:text-primary"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-clip px-[clamp(0.65rem,1.4vw,1rem)] py-3">
              {props.children}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <SharedSidebarPanel
      {...props}
      getNavbarOffsetPx={getNavbarOffsetPx}
      getMainElement={() =>
        document.querySelector<HTMLElement>('[data-sidebar-host]') ??
        document.querySelector<HTMLElement>('main')
      }
      getFooterElement={() =>
        document.querySelector<HTMLElement>('#site-footer')
      }
      getPositionScrollTarget={() => window}
      scrollToTop={() => window.scrollTo({ top: 0, behavior: 'auto' })}
      scrollClassName="sidebar-scroll"
    />
  );
}
