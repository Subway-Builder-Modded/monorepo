import { AppDialog } from '@subway-builder-modded/shared-ui';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { STEAM_NOT_RUNNING, useGameStore } from '@/stores/game-store';

import { BrowserOpenURL } from '../../../wailsjs/runtime/runtime';

// Opening the Steam client so the user can clear whatever is blocking the launch. The game launch
// itself was already requested via steam://, so discovery keeps running underneath.
const STEAM_OPEN_URL = 'steam://open/main';
const DISCOVERY_TOAST_ID = 'steam-discovery-waiting';

// SteamLaunchStatus surfaces a Steam launch that hasn't produced a game process yet. Discovery runs
// in the backend; this component only reflects its state and forwards the user's choices.
export function SteamLaunchStatus() {
  const launchBlock = useGameStore((s) => s.launchBlock);
  const discoveryWaiting = useGameStore((s) => s.discoveryWaiting);
  const gaveUpMessage = useGameStore((s) => s.gaveUpMessage);
  const keepWaiting = useGameStore((s) => s.keepWaiting);
  const cancelLaunch = useGameStore((s) => s.cancelLaunch);
  const clearGaveUp = useGameStore((s) => s.clearGaveUp);

  // Non-blocking "still discovering" indicator. The store clears discoveryWaiting on
  // running/gave-up/cancel, which tears the toast down via the cleanup.
  useEffect(() => {
    if (!discoveryWaiting) {
      return;
    }
    toast(
      <div className="flex w-full flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span className="truncate text-sm font-medium">
            Waiting for the game to start…
          </span>
        </div>
        <button
          type="button"
          onClick={() => cancelLaunch()}
          className="flex items-center gap-1 self-start text-xs font-medium text-destructive hover:underline"
        >
          <X className="h-3.5 w-3.5 shrink-0" />
          Cancel launch
        </button>
      </div>,
      { id: DISCOVERY_TOAST_ID, duration: Infinity },
    );
    return () => {
      toast.dismiss(DISCOVERY_TOAST_ID);
    };
  }, [discoveryWaiting, cancelLaunch]);

  // Hard-cap notice.
  useEffect(() => {
    if (!gaveUpMessage) {
      return;
    }
    toast.error(gaveUpMessage, { duration: 6000 });
    clearGaveUp();
  }, [gaveUpMessage, clearGaveUp]);

  if (!launchBlock) {
    return null;
  }

  // Blocked modal: the user chooses Open Steam / Keep Waiting, or Cancel Launch (dismissing the
  // dialog counts as Cancel). Keep Waiting hands off to the background indicator above.
  const steamNotRunning = launchBlock.errorType === STEAM_NOT_RUNNING;
  const confirm = steamNotRunning
    ? {
        label: 'Open Steam',
        cancelLabel: 'Cancel Launch',
        onConfirm: () => {
          BrowserOpenURL(STEAM_OPEN_URL);
          keepWaiting();
        },
      }
    : {
        label: 'Keep Waiting',
        cancelLabel: 'Cancel Launch',
        onConfirm: () => keepWaiting(),
      };

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        // Dismissal (Cancel Launch button / Escape / click-away) is the strict action: abort.
        if (!open) {
          cancelLaunch();
        }
      }}
      title={steamNotRunning ? "Steam Isn't Running" : 'Waiting for Steam'}
      icon={AlertTriangle}
      description={launchBlock.message}
      tone="files"
      confirm={confirm}
    />
  );
}
