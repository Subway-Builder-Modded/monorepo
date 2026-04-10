'use client';

import * as React from 'react';
import { PanelLeftCloseIcon } from 'lucide-react';
import { cn } from '@subway-builder-modded/shared-ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  MOBILE_SIDEBAR_TOP_OFFSET,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_TOTAL_OFFSET_REM,
  SIDEBAR_WIDTH_REM,
  readSidebarOpenStateFromCookieString,
} from '@/features/docs/components/docs-sidebar/helpers';
import {
  useDocsIsMobile,
  useSidebarFloatingLayout,
  useSidebarScrollThumb,
} from '@/features/docs/components/docs-sidebar/hooks';
import { SidebarPanelContent } from '@/features/docs/components/docs-sidebar/sidebar-panel-content';
import { type DocsSidebarTree } from '@/lib/docs/shared';

type AppDocsSidebarProps = {
  tree?: DocsSidebarTree;
  versionDocSlugs?: Record<string, string[]>;
  open: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  isMobileResolved: boolean | null;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

export function AppDocsSidebar({
  tree,
  versionDocSlugs,
  open,
  onToggle,
  mobileOpen,
  onMobileOpenChange,
  isMobileResolved,
  containerRef,
}: AppDocsSidebarProps) {
  const panelRef = React.useRef<HTMLElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { sidebarLeft, sidebarMaxHeight, sidebarTop, refreshLayout } =
    useSidebarFloatingLayout({
      open,
      containerRef,
      panelRef,
    });

  const { showScrollThumb, thumbHeight, thumbTop } = useSidebarScrollThumb({
    open,
    scrollRef,
  });

  const handleStructureChange = React.useCallback(() => {
    refreshLayout();
    requestAnimationFrame(() => {
      refreshLayout();
    });
  }, [refreshLayout]);

  if (isMobileResolved === null) {
    return null;
  }

  if (isMobileResolved) {
    return (
      <Sheet isOpen={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          closeButton={false}
          isFloat={false}
          overlayClassName="bg-transparent backdrop-blur-0"
          className={cn(
            'inset-y-auto top-[var(--docs-mobile-sidebar-top)] h-[calc(100svh-var(--docs-mobile-sidebar-top))]',
            'w-(--sidebar-width) max-w-none bg-sidebar p-0 text-sidebar-foreground',
            'entering:duration-200 entering:ease-out exiting:duration-160 exiting:ease-in',
            '[&>button]:hidden',
          )}
          style={
            {
              '--docs-mobile-sidebar-top': MOBILE_SIDEBAR_TOP_OFFSET,
              '--sidebar-width': `${SIDEBAR_WIDTH_REM}rem`,
            } as React.CSSProperties
          }
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Docs navigation</SheetTitle>
            <SheetDescription>Browse the documentation.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col overflow-hidden">
            <SidebarPanelContent
              tree={tree}
              versionDocSlugs={versionDocSlugs}
              scrollRef={scrollRef}
              onStructureChange={handleStructureChange}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: sidebarLeft,
    top: sidebarTop,
    width: `${SIDEBAR_WIDTH_REM}rem`,
    maxHeight: sidebarMaxHeight,
  };

  const toggleStyle: React.CSSProperties = {
    position: 'fixed',
    left: sidebarLeft,
    top: sidebarTop,
    width: '2.5rem',
  };

  return (
    <>
      <aside
        ref={panelRef}
        aria-label="Docs navigation"
        className={cn(
          'z-40 flex flex-col overflow-hidden',
          'rounded-2xl border border-border/70 bg-background/90 backdrop-blur-md shadow-sm',
          'transition-[opacity,transform] duration-200 ease-out',
          open
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 -translate-x-3 pointer-events-none',
        )}
        style={panelStyle}
      >
        <div className="group/sidebar relative flex min-h-0 flex-1 flex-col">
          <SidebarPanelContent
            tree={tree}
            versionDocSlugs={versionDocSlugs}
            scrollRef={scrollRef}
            onCollapse={onToggle}
            onStructureChange={handleStructureChange}
          />

          {showScrollThumb && (
            <div className="pointer-events-none absolute bottom-3 right-1 top-3 w-1 opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
              <div
                className="absolute left-0 w-full rounded-full bg-[color-mix(in_srgb,var(--foreground)_28%,transparent)]"
                style={{
                  height: thumbHeight,
                  transform: `translateY(${thumbTop}px)`,
                }}
              />
            </div>
          )}
        </div>
      </aside>

      <div
        className={cn(
          'z-40 flex flex-col items-stretch overflow-hidden',
          'rounded-xl border border-border/70 bg-background/90 backdrop-blur-md shadow-sm',
          'text-muted-foreground transition-all duration-200 ease-out',
          open
            ? 'opacity-0 pointer-events-none scale-90'
            : 'opacity-100 scale-100 pointer-events-auto',
        )}
        style={toggleStyle}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand docs sidebar"
          className="flex h-10 w-full items-center justify-center transition-colors hover:bg-accent/45 hover:text-primary"
        >
          <PanelLeftCloseIcon className="h-4 w-4 rotate-180" />
        </button>
      </div>
    </>
  );
}

function getInitialSidebarOpenState() {
  if (typeof document === 'undefined') return true;
  const parsed = readSidebarOpenStateFromCookieString(document.cookie);
  return parsed ?? true;
}

export function DocsSidebarShell({
  children,
  tree,
  versionDocSlugs,
}: {
  children: React.ReactNode;
  tree?: DocsSidebarTree;
  versionDocSlugs?: Record<string, string[]>;
}) {
  const [open, setOpen] = React.useState(getInitialSidebarOpenState);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isMobileResolved = useDocsIsMobile();
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isMobileResolved === false) {
      setMobileOpen(false);
    }
  }, [isMobileResolved]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    } catch {
      // ignore cookie write failures (private mode, blocked cookies, etc.)
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <AppDocsSidebar
        tree={tree}
        versionDocSlugs={versionDocSlugs}
        open={open}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        isMobileResolved={isMobileResolved}
        containerRef={containerRef}
      />
      <div
        className={cn(
          'min-w-0 w-full transition-[padding-left] duration-200 ease-out',
          open &&
            isMobileResolved !== true &&
            'md:pl-[var(--docs-sidebar-content-offset)]',
        )}
        style={
          {
            '--docs-sidebar-content-offset': `${SIDEBAR_TOTAL_OFFSET_REM}rem`,
          } as React.CSSProperties
        }
      >
        {isMobileResolved === true && (
          <div className="sticky top-[var(--app-navbar-offset,5.5rem)] z-20 px-5 pt-4 pb-0 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/90 px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur-md hover:bg-accent/45 hover:text-primary"
            >
              <PanelLeftCloseIcon className="size-4 rotate-180" />
              Expand Sidebar
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
