export const GITHUB_TOKEN_DOCS_URL =
  'https://subwaybuildermodded.com/railyard/docs/latest/github-token/';

export const REQUEST_ERROR_MESSAGES = {
  unauthorized:
    'GitHub indicated an authorization error. Your GitHub token may be invalid or lack necessary permissions.',
  forbidden:
    'GitHub indicated a permission error. Your GitHub token may be invalid or lack necessary permissions.',
  tooMany:
    'You are being rate limited. You may benefit from setting a GitHub token, as shown $HERE.',
} as const;

export type RequestErrorDialogContent = {
  title: string;
  description: string;
  showDocsAction: boolean;
};

export function toRequestErrorDialogContent(
  message: string,
): RequestErrorDialogContent {
  const normalized = message.trim();

  if (normalized === REQUEST_ERROR_MESSAGES.unauthorized) {
    return {
      title: 'GitHub Authorization Error',
      description: normalized,
      showDocsAction: true,
    };
  }

  if (normalized === REQUEST_ERROR_MESSAGES.forbidden) {
    return {
      title: 'GitHub Permission Error',
      description: normalized,
      showDocsAction: true,
    };
  }

  if (normalized === REQUEST_ERROR_MESSAGES.tooMany) {
    return {
      title: 'GitHub Rate Limit Reached',
      description:
        'You are being rate limited by GitHub. Setting a GitHub token can increase your API limits.',
      showDocsAction: true,
    };
  }

  return {
    title: 'GitHub Request Failed',
    description: normalized,
    showDocsAction: false,
  };
}
