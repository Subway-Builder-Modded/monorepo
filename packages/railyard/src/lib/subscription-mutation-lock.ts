export const SUBSCRIPTION_MUTATION_LOCK_MESSAGE =
  'Cannot modify subscriptions while the game is running.';

export const SUBSCRIPTION_MUTATION_LOCK_ERROR_CODE =
  'subscription_mutation_locked' as const;

export interface SubscriptionMutationLockedErrorLike {
  code: typeof SUBSCRIPTION_MUTATION_LOCK_ERROR_CODE;
  message: string;
}

export function isSubscriptionMutationLocked(gameRunning: boolean): boolean {
  return gameRunning;
}

export function isSubscriptionMutationLockedError(
  error: unknown,
): error is SubscriptionMutationLockedErrorLike {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    code?: unknown;
    message?: unknown;
  };

  return (
    maybeError.code === SUBSCRIPTION_MUTATION_LOCK_ERROR_CODE &&
    typeof maybeError.message === 'string'
  );
}
