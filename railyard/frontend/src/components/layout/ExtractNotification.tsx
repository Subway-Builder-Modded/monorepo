import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useDownloadQueueStore } from '@/stores/download-queue-store';

import { EventsOn } from '../../../wailsjs/runtime/runtime';
interface ExtractProgress {
  itemId: string;
  amountExtracted: number;
  total: number;
}

export function ExtractNotification() {
  const toastIds = useRef<Map<string, string | number>>(new Map());

  useEffect(() => {
    const cancel = EventsOn('extract:progress', (data: ExtractProgress) => {
      const { itemId, amountExtracted, total } = data;
      const isComplete = total > 0 && amountExtracted >= total;

      if (isComplete) {
        const existingId = toastIds.current.get(itemId);
        if (existingId) {
          const { completed, total: queueTotal } =
            useDownloadQueueStore.getState();
          const queueLabel =
            queueTotal > 1 ? `${completed + 1}/${queueTotal}` : null;

          toast.success(`Extracted ${itemId}`, {
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

      const description = `Extracting... (${amountExtracted} / ${total})`;
      const fullDescription = queueLabel
        ? `${description} • Queue ${queueLabel}`
        : description;

      const existingId = toastIds.current.get(itemId);
      if (existingId) {
        toast.loading(`Extracting ${itemId}`, {
          id: existingId,
          duration: Infinity,
          description: fullDescription,
        });
      } else {
        const id = toast.loading(`Extracting ${itemId}`, {
          duration: Infinity,
          description: fullDescription,
        });
        toastIds.current.set(itemId, id);
      }
    });

    return cancel;
  }, []);

  return null;
}
