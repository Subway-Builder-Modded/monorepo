import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { EventsOn } from '../../../wailsjs/runtime/runtime';
import {
  TOAST_PROGRESS_FILL_CLASS,
  TOAST_PROGRESS_TRACK_CLASS,
} from './notification-classes';

interface RegistryProgress {
  stage: string;
  phase: string;
  current: number;
  total: number;
  percent: number;
  message: string;
  error: string;
}

const REGISTRY_TOAST_ID = 'registry-refresh';

const STAGE_LABELS: Record<string, string> = {
  starting: 'Connecting to registry…',
  counting: 'Indexing registry data…',
  compressing: 'Compressing registry data…',
  receiving: 'Downloading registry data…',
  resolving: 'Processing registry updates…',
  checkout: 'Updating local files…',
};

// Stages with no numeric percent: 'starting' is tied to pre-git operations, 'checkout' is the synthetic event the backend emits around wt.Checkout() since go-git doesn't report on-disk materialization via textual output.
// Both indeterminate stages are presented from the backend with Percent: -1
const INDETERMINATE_STAGES = new Set(['starting', 'checkout']);

export function RegistryRefreshNotification() {
  useEffect(() => {
    const cancel = EventsOn(
      'registry:refresh-progress',
      (data: RegistryProgress) => {
        if (data.stage === 'complete') {
          toast(
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium truncate">
                Registry up to date
              </span>
            </div>,
            { id: REGISTRY_TOAST_ID, duration: 1500 },
          );
          return;
        }

        // TODO: Let's parse the errors to raise to the user
        if (data.stage === 'error') {
          toast(
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span className="text-sm font-medium truncate">
                  Registry refresh failed
                </span>
              </div>
              {data.error && (
                <div className="text-xs text-muted-foreground truncate">
                  {data.error}
                </div>
              )}
            </div>,
            { id: REGISTRY_TOAST_ID, duration: 5000 },
          );
          return;
        }

        const label = STAGE_LABELS[data.stage] ?? 'Refreshing registry…';
        const percent = INDETERMINATE_STAGES.has(data.stage)
          ? null
          : Math.max(0, Math.min(100, data.percent));

        toast(
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
              <span className="text-sm font-medium truncate">{label}</span>
              {percent !== null && (
                <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums shrink-0">
                  {percent}%
                </span>
              )}
            </div>
            <div className={TOAST_PROGRESS_TRACK_CLASS}>
              {percent !== null && (
                <div
                  className={TOAST_PROGRESS_FILL_CLASS}
                  style={{ width: `${percent}%` }}
                />
              )}
            </div>
          </div>,
          // Stay visible until the next event replaces this toast — a finite duration could time out mid-refresh.
          { id: REGISTRY_TOAST_ID, duration: Infinity },
        );
      },
    );

    return cancel;
  }, []);

  return null;
}
