'use client';

import {
  SIDEBAR_CONTENT_OFFSET,
  SidebarPanel as SharedSidebarPanel,
} from '@subway-builder-modded/asset-listings-ui';
import { SlidersHorizontal, X } from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { SearchFilterState } from '@/hooks/use-filtered-items';
import { cn } from '@/lib/utils';

export { SIDEBAR_CONTENT_OFFSET };

const MOBILE_SIDEBAR_TOP = 'var(--app-navbar-offset, 5.5rem)';

function getNavbarOffsetPx(): number {
  const base =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--app-navbar-offset',
      ),
    ) || 88;
  return Math.max(0, base - 24);
}

export interface SidebarPanelProps {
  open: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  ariaLabel: string;
  filters: SearchFilterState;
  children: ReactNode;
  collapsedContent?: ReactNode;
}

export function SidebarPanel({
  open,
  onToggle,
  mobileOpen = false,
  onMobileOpenChange,
  ariaLabel,
  filters,
  children,
  collapsedContent,
}: SidebarPanelProps) {
  const [isMobileResolved, setIsMobileResolved] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobileResolved(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  if (isMobileResolved === null) {
    return null;
  }

  if (isMobileResolved) {
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
          aria-label={ariaLabel}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Browse filters</SheetTitle>
            <SheetDescription>Filter browse results</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">
                  Filters
                </span>
              </div>
              <button
                type="button"
                onClick={() => onMobileOpenChange?.(false)}
                aria-label="Close filters"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/45 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {children}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <SharedSidebarPanel
      open={open}
      onToggle={onToggle}
      ariaLabel={ariaLabel}
      filters={filters}
      collapsedContent={collapsedContent}
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
      scrollClassName="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </SharedSidebarPanel>
  );
}
