import { describe, expect, it } from 'vitest';

import {
  REQUEST_ERROR_MESSAGES,
  toRequestErrorDialogContent,
} from './RequestErrorDialog';

describe('toRequestErrorDialogContent', () => {
  it('maps unauthorized message to authorization dialog content', () => {
    expect(
      toRequestErrorDialogContent(REQUEST_ERROR_MESSAGES.unauthorized),
    ).toEqual({
      title: 'GitHub Authorization Error',
      description: REQUEST_ERROR_MESSAGES.unauthorized,
      showDocsAction: true,
    });
  });

  it('maps forbidden message to permission dialog content', () => {
    expect(toRequestErrorDialogContent(REQUEST_ERROR_MESSAGES.forbidden)).toEqual(
      {
        title: 'GitHub Permission Error',
        description: REQUEST_ERROR_MESSAGES.forbidden,
        showDocsAction: true,
      },
    );
  });

  it('maps rate-limit message to docs-oriented dialog content', () => {
    expect(toRequestErrorDialogContent(REQUEST_ERROR_MESSAGES.tooMany)).toEqual({
      title: 'GitHub Rate Limit Reached',
      description:
        'You are being rate limited by GitHub. Setting a GitHub token can increase your API limits.',
      showDocsAction: true,
    });
  });

  it('maps unknown messages to generic fallback content without docs action', () => {
    const message = 'GitHub request failed with status code 502.';

    expect(toRequestErrorDialogContent(message)).toEqual({
      title: 'GitHub Request Failed',
      description: message,
      showDocsAction: false,
    });
  });

  it('trims incoming messages before classification', () => {
    const message = `  ${REQUEST_ERROR_MESSAGES.unauthorized}  `;

    expect(toRequestErrorDialogContent(message)).toEqual({
      title: 'GitHub Authorization Error',
      description: REQUEST_ERROR_MESSAGES.unauthorized,
      showDocsAction: true,
    });
  });
});
