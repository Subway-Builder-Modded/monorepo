import { describe, expect, it } from 'vitest';

import {
  isSubscriptionMutationLocked,
  isSubscriptionMutationLockedError,
  SUBSCRIPTION_MUTATION_LOCK_ERROR_CODE,
} from '@/lib/subscription-mutation-lock';

describe('subscription-mutation-lock', () => {
  it('detects lock state from game running flag', () => {
    expect(isSubscriptionMutationLocked(true)).toBe(true);
    expect(isSubscriptionMutationLocked(false)).toBe(false);
  });

  it('detects typed lock errors', () => {
    expect(
      isSubscriptionMutationLockedError({
        code: SUBSCRIPTION_MUTATION_LOCK_ERROR_CODE,
        message: 'Cannot modify subscriptions while the game is running.',
      }),
    ).toBe(true);

    expect(
      isSubscriptionMutationLockedError({
        code: 'different_code',
        message: 'Cannot modify subscriptions while the game is running.',
      }),
    ).toBe(false);
  });
});
