import { useEffect } from 'react';
import { toast } from 'sonner';

import { EventsOn } from '../../../wailsjs/runtime/runtime';

export function RequestErrorNotification() {
  useEffect(() => {
    const cancel = EventsOn('requests:request-error', (message: string) => {
      if (!message) {
        return;
      }

      toast.error(
        message.replace(
          '$HERE',
          'https://subwaybuildermodded.com/railyard/docs/latest/players/github-token/',
        ),
        {
          duration: 5000,
          id: 'request-error',
        },
      );
    });

    return cancel;
  }, []);

  return null;
}
