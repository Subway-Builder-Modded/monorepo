// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useOnlineStatus, useVisibilityChange } from './events';

describe('useVisibilityChange', () => {
  let hidden = false;

  beforeEach(() => {
    hidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });
  });

  afterEach(() => {
    delete (document as Document & { hidden?: boolean }).hidden;
  });

  it('tracks visibilitychange events', async () => {
    const { result } = renderHook(() => useVisibilityChange());

    expect(result.current).toBe('visible');

    act(() => {
      hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(result.current).toBe('hidden'));
  });
});

describe('useOnlineStatus', () => {
  let online = true;

  beforeEach(() => {
    online = true;
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => online,
    });
  });

  afterEach(() => {
    delete (window.navigator as Navigator & { onLine?: boolean }).onLine;
  });

  it('tracks online and offline browser events', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    act(() => {
      online = false;
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => expect(result.current).toBe(false));

    act(() => {
      online = true;
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(result.current).toBe(true));
  });
});