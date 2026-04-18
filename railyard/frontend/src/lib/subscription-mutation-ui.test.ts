import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockToastError, mockToastWarning } = vi.hoisted(() => ({
  mockToastWarning: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    warning: mockToastWarning,
    error: mockToastError,
  },
}));

const { mockUseGameStore } = vi.hoisted(() => ({
  mockUseGameStore: vi.fn(),
}));

vi.mock('@/stores/game-store', () => ({
  useGameStore: mockUseGameStore,
}));

import {
  SUBSCRIPTION_MUTATION_LOCK_MESSAGE,
  SubscriptionMutationLockedError,
} from '@/lib/subscription-mutation-client';
import {
  handleSubscriptionMutationError,
  useSubscriptionMutationLockState,
  withLockAwareConfirm,
} from '@/lib/subscription-mutation-ui';

describe('subscription-mutation-ui', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGameStore.mockImplementation(
      (selector: (state: { running: boolean }) => unknown) =>
        selector({ running: false }),
    );
  });

  it('applies disabled state and reason to dialog confirms when locked', () => {
    const confirm = withLockAwareConfirm(
      {
        label: 'Confirm',
        onConfirm: vi.fn(),
      },
      true,
    );

    expect(confirm.disabled).toBe(true);
    expect(confirm.disabledReason).toBe(SUBSCRIPTION_MUTATION_LOCK_MESSAGE);
  });

  it('keeps explicit disabled reason when already provided', () => {
    const confirm = withLockAwareConfirm(
      {
        label: 'Confirm',
        onConfirm: vi.fn(),
        disabledReason: 'Already disabled',
      },
      true,
    );

    expect(confirm.disabled).toBe(true);
    expect(confirm.disabledReason).toBe('Already disabled');
  });

  it('leaves confirm enabled when unlocked and no disabled state is provided', () => {
    const confirm = withLockAwareConfirm(
      {
        label: 'Confirm',
        onConfirm: vi.fn(),
      },
      false,
    );

    expect(confirm.disabled).toBe(false);
    expect(confirm.disabledReason).toBeUndefined();
  });

  it('returns the lock state derived from the game store', () => {
    mockUseGameStore.mockImplementation(
      (selector: (state: { running: boolean }) => unknown) =>
        selector({ running: true }),
    );

    expect(useSubscriptionMutationLockState()).toEqual({
      locked: true,
      reason: SUBSCRIPTION_MUTATION_LOCK_MESSAGE,
    });
  });

  it('routes lock errors to warning toast', () => {
    const handled = handleSubscriptionMutationError(
      new SubscriptionMutationLockedError(),
      'fallback error',
    );

    expect(handled).toBe(true);
    expect(mockToastWarning).toHaveBeenCalledTimes(1);
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('routes non-lock errors to fallback toast', () => {
    const handled = handleSubscriptionMutationError(
      new Error('boom'),
      'fallback error',
    );

    expect(handled).toBe(false);
    expect(mockToastWarning).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith('fallback error');
  });

  it('routes non-lock errors to fallback callback', () => {
    const fallback = vi.fn();
    const error = new Error('boom');

    const handled = handleSubscriptionMutationError(error, fallback);

    expect(handled).toBe(false);
    expect(fallback).toHaveBeenCalledWith(error);
    expect(mockToastWarning).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
