import {
  isNavItemActive,
  RAILYARD_SHARED_NAVBAR_MODEL,
  type SharedNavItem,
} from '@subway-builder-modded/config';
import {
  APP_SHELL_PADDING_CLASS,
  APP_SHELL_WIDTH_CLASS,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  NavbarActionsSlot,
  NavbarBrandBlock,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarShell,
  NavbarSpacer,
} from '@subway-builder-modded/shared-ui';
import {
  CircleUser,
  Compass,
  Inbox,
  Play,
  RefreshCw,
  Settings,
  Square,
  Terminal,
  TrainTrack,
} from 'lucide-react';
import { type ComponentType, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Link, useLocation } from 'wouter';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useConfigStore } from '@/stores/config-store';
import { useGameStore } from '@/stores/game-store';
import { useInstalledStore } from '@/stores/installed-store';
import { useRegistryStore } from '@/stores/registry-store';

const NAV_ICON_BY_KEY: Partial<
  Record<string, ComponentType<{ className?: string }>>
> = {
  browse: Compass,
  library: Inbox,
  profiles: CircleUser,
  logs: Terminal,
  settings: Settings,
};

const MAIN_NAV_ITEMS: SharedNavItem[] =
  RAILYARD_SHARED_NAVBAR_MODEL.sections
    .find((section) => section.id === 'main')
    ?.items.filter((item): item is SharedNavItem => Boolean(item.href)) ?? [];

const MOD_REMINDER_KEY = 'railyard:mod-reminder-acknowledged';
const NAV_ITEM_BASE_CLASS =
  'group relative flex items-center gap-2 rounded-lg px-[clamp(0.45rem,0.95vw,0.7rem)] py-[clamp(0.4rem,0.82vw,0.56rem)] text-[clamp(0.8rem,0.95vw,0.9rem)] font-semibold text-muted-foreground transition-all duration-150';
const NAV_ITEM_GREEN_HOVER_CLASS = 'hover:text-primary hover:bg-accent/45';
const NAV_CURRENT_INDICATOR_CLASS =
  'absolute -bottom-[0.38rem] left-1/2 h-1 w-[calc(100%-1rem)] -translate-x-1/2 rounded-full bg-primary';
const NAVBAR_TOP_OFFSET_PX = 48;
const NAVBAR_BOTTOM_GAP_PX = 12;

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const [location] = useLocation();
  const refresh = useRegistryStore((s) => s.refresh);
  const loading = useRegistryStore((s) => s.loading);
  const refreshing = useRegistryStore((s) => s.refreshing);
  const canLaunch = useConfigStore((s) => s.validation?.executablePathValid);
  const running = useGameStore((s) => s.running);
  const launch = useGameStore((s) => s.launch);
  const stop = useGameStore((s) => s.stop);
  const installedMaps = useInstalledStore((s) => s.installedMaps);
  const [showModReminder, setShowModReminder] = useState(false);

  const runWithToast = async (
    action: () => Promise<void>,
    fallbackMessage: string,
  ) => {
    try {
      await action();
    } catch (err) {
      toast.error(String(err) || fallbackMessage);
    }
  };

  const handleLaunch = async () => {
    const hasMaps = installedMaps.length > 0;
    const alreadyAcknowledged =
      localStorage.getItem(MOD_REMINDER_KEY) === 'true';

    if (hasMaps && !alreadyAcknowledged) {
      setShowModReminder(true);
      return;
    }

    await runWithToast(launch, 'Failed to launch game.');
  };

  const handleAcknowledgeAndLaunch = async () => {
    localStorage.setItem(MOD_REMINDER_KEY, 'true');
    setShowModReminder(false);
    await runWithToast(launch, 'Failed to launch game.');
  };

  const handleStop = async () => runWithToast(stop, 'Failed to stop game.');

  useEffect(() => {
    const element = headerRef.current;
    if (!element) {
      return;
    }

    const updateOffset = () => {
      const offset = Math.ceil(
        element.getBoundingClientRect().height +
          NAVBAR_TOP_OFFSET_PX +
          NAVBAR_BOTTOM_GAP_PX,
      );
      document.documentElement.style.setProperty(
        '--app-navbar-offset',
        `${offset}px`,
      );
    };

    updateOffset();
    const hasResizeObserver =
      typeof window !== 'undefined' &&
      typeof window.ResizeObserver === 'function';
    const observer = hasResizeObserver
      ? new window.ResizeObserver(updateOffset)
      : null;

    if (observer) {
      observer.observe(element);
    }

    window.addEventListener('resize', updateOffset);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener('resize', updateOffset);
      document.documentElement.style.removeProperty('--app-navbar-offset');
    };
  }, []);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-3 z-50">
      <div className={cn(APP_SHELL_WIDTH_CLASS, APP_SHELL_PADDING_CLASS)}>
        <NavbarShell>
          <NavbarSection className="gap-[clamp(0.6rem,1.8vw,1.25rem)]">
            <NavbarBrandBlock
              asChild
              className="font-extrabold tracking-[0.01em] text-foreground [--app-navbar-brand-gap:0.45rem]"
            >
              <Link href="/">
                <TrainTrack className="h-[1.2em] w-[1.2em]" />
                <NavbarLabel>Railyard</NavbarLabel>
              </Link>
            </NavbarBrandBlock>
            <nav className="flex max-w-full flex-wrap items-center gap-1.5">
              {MAIN_NAV_ITEMS.map((item) => {
                const Icon = item.iconKey
                  ? NAV_ICON_BY_KEY[item.iconKey]
                  : undefined;
                if (!Icon || !item.href) {
                  return null;
                }

                const current = isNavItemActive(
                  location,
                  item.activeMatchRules,
                  item.href,
                );

                return (
                  <NavbarItem
                    key={item.id}
                    asChild
                    isActive={current}
                    className={cn(
                      NAV_ITEM_BASE_CLASS,
                      NAV_ITEM_GREEN_HOVER_CLASS,
                    )}
                  >
                    <Link
                      href={item.href}
                      aria-current={current ? 'page' : undefined}
                    >
                      <Icon className="h-[1.05em] w-[1.05em] shrink-0 transition-colors" />
                      <NavbarLabel>{item.label}</NavbarLabel>
                    </Link>
                  </NavbarItem>
                );
              })}
            </nav>
          </NavbarSection>

          <NavbarSpacer />

          <NavbarActionsSlot>
            {running ? (
              <NavbarItem
                asChild
                className="bg-[color-mix(in_srgb,var(--install-primary)_20%,transparent)] text-[var(--install-primary)] hover:!bg-[color-mix(in_srgb,var(--uninstall-primary)_24%,transparent)] hover:!text-[var(--uninstall-primary)]"
              >
                <Button variant="ghost" size="sm" onClick={handleStop}>
                  <Square className="mr-1.5 h-[1.125rem] w-[1.125rem]" />
                  Running
                  <span
                    aria-hidden
                    className={cn(
                      NAV_CURRENT_INDICATOR_CLASS,
                      'bg-[var(--install-primary)] transition-colors group-hover:bg-[var(--uninstall-primary)]',
                    )}
                  />
                </Button>
              </NavbarItem>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <NavbarItem asChild className={NAV_ITEM_GREEN_HOVER_CLASS}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLaunch}
                        disabled={!canLaunch}
                        className="disabled:opacity-50"
                      >
                        <Play className="mr-1.5 h-[1.125rem] w-[1.125rem]" />
                        Launch
                      </Button>
                    </NavbarItem>
                  </span>
                </TooltipTrigger>
                {!canLaunch && (
                  <TooltipContent>
                    Configure game executable in Settings first
                  </TooltipContent>
                )}
              </Tooltip>
            )}
            <NavbarItem asChild className={NAV_ITEM_GREEN_HOVER_CLASS}>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={loading || refreshing}
              >
                <RefreshCw
                  className={cn(
                    'mr-1 h-[1.125rem] w-[1.125rem]',
                    (loading || refreshing) && 'animate-spin',
                  )}
                />
                Refresh
              </Button>
            </NavbarItem>
          </NavbarActionsSlot>
        </NavbarShell>
      </div>

      <Dialog open={showModReminder} onOpenChange={setShowModReminder}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Enable Railyard Map Loader</DialogTitle>
            <DialogDescription>
              You have custom maps installed. To use them in-game, make sure the{' '}
              <span className="font-semibold text-foreground">
                Railyard Map Loader
              </span>{' '}
              mod is enabled in the game's mod manager.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModReminder(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledgeAndLaunch}>
              Got it, launch game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
