import { AppDialog } from '@subway-builder-modded/shared-ui';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BrowserOpenURL, EventsOn } from '../../../wailsjs/runtime/runtime';
import {
  GITHUB_TOKEN_DOCS_URL,
  type RequestErrorDialogContent,
  toRequestErrorDialogContent,
} from './request-error-dialog-content';

export function RequestErrorDialog() {
  const [content, setContent] = useState<RequestErrorDialogContent | null>(null);

  useEffect(() => {
    const cancel = EventsOn('requests:request-error', (message: string) => {
      if (!message?.trim()) {
        return;
      }

      setContent(toRequestErrorDialogContent(message));
    });

    return cancel;
  }, []);

  if (!content) {
    return null;
  }

  return (
    <AppDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          setContent(null);
        }
      }}
      title={content.title}
      icon={AlertTriangle}
      description={content.description}
      tone="files"
      confirm={
        content.showDocsAction
          ? {
              label: 'Open Token Docs',
              cancelLabel: 'Dismiss',
              onConfirm: () => {
                BrowserOpenURL(GITHUB_TOKEN_DOCS_URL);
                setContent(null);
              },
            }
          : undefined
      }
    />
  );
}
