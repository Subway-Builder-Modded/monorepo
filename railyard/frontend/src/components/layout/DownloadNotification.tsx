import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useDownloadQueueStore } from '@/stores/download-queue-store';
import { useInstalledStore } from '@/stores/installed-store';

import { EventsOn } from '../../../wailsjs/runtime/runtime';
interface DownloadProgress {
  itemId: string;
  received: number;
  total: number;
}

interface DownloadCancelled {
  itemId?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadNotification() {
  const toastIds = useRef<Map<string, string | number>>(new Map());
  const cancelledItems = useRef<Set<string>>(new Set());

  useEffect(() => {
    const cancel = EventsOn('download:progress', (data: DownloadProgress) => {
      const { itemId, received, total } = data;
      const isInstalling = useInstalledStore.getState().isInstalling(itemId);

      if (cancelledItems.current.has(itemId)) {
        if (!isInstalling) {
          return;
        }
        cancelledItems.current.delete(itemId);
      }

      const percent = total > 0 ? Math.round((received / total) * 100) : -1;
      const isComplete = total > 0 && received >= total;

      if (isComplete) {
        const existingId = toastIds.current.get(itemId);
        if (existingId) {
          const { completed, total: queueTotal } =
            useDownloadQueueStore.getState();
          const queueLabel =
            queueTotal > 1 ? `${completed + 1}/${queueTotal}` : null;

          toast.success(`Downloaded ${itemId}`, {
            id: existingId,
            duration: 2000,
            description: queueLabel ? `Queue ${queueLabel}` : undefined,
          });
          toastIds.current.delete(itemId);
        }
        return;
      }

      const { completed, total: queueTotal } = useDownloadQueueStore.getState();
      const queueLabel =
        queueTotal > 1 ? `${completed + 1}/${queueTotal}` : null;

      const description =
        percent >= 0
          ? `${formatBytes(received)} / ${formatBytes(total)} (${percent}%)`
          : `${formatBytes(received)} downloaded`;

      const fullDescription = queueLabel
        ? `${description} • Queue ${queueLabel}`
        : description;

      const existingId = toastIds.current.get(itemId);
      if (existingId) {
        toast.loading(`Downloading ${itemId}`, {
          id: existingId,
          duration: Infinity,
          description: fullDescription,
        });
      } else {
        const id = toast.loading(`Downloading ${itemId}`, {
          duration: Infinity,
          description: fullDescription,
        });
        toastIds.current.set(itemId, id);
      }
    });

    const cancelDownload = EventsOn(
      'download:cancelled',
      (data: DownloadCancelled) => {
        if (!data?.itemId) {
          return;
        }
        cancelledItems.current.add(data.itemId);
        const existingId = toastIds.current.get(data.itemId);
        if (!existingId) {
          return;
        }
        toast.dismiss(existingId);
        toastIds.current.delete(data.itemId);
      },
    );

    return () => {
      cancelDownload();
      cancel();
    };
  }, []);

  return null;
}
