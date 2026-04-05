import { AlertTriangle } from 'lucide-react';
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
          "<a href='https://subwaybuildermodded.com/railyard/docs/latest/players/github-token/' target='_blank' rel='noopener noreferrer'>here</a>",
        ),
        {
          icon: <AlertTriangle className="h-4 w-4" />,
          duration: 5000,
          id: 'request-error',
        },
      );
    });

    return cancel;
  }, []);

  return null;
}
