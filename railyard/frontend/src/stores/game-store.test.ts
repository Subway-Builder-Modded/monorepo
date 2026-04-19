import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from './game-store';

const {
  mockIsGameRunning,
  mockLaunchGame,
  mockStopGame,
  mockEventsOn,
} = vi.hoisted(() => ({
  mockIsGameRunning: vi.fn(),
  mockLaunchGame: vi.fn(),
  mockStopGame: vi.fn(),
  mockEventsOn: vi.fn(),
}));

const eventHandlers = new Map<string, (payload: unknown) => void>();

vi.mock('../../wailsjs/go/main/App', () => ({
  IsGameRunning: mockIsGameRunning,
  LaunchGame: mockLaunchGame,
  StopGame: mockStopGame,
}));

vi.mock('../../wailsjs/runtime/runtime', () => ({
  EventsOn: mockEventsOn,
}));

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useGameStore launch state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers.clear();
    mockEventsOn.mockImplementation(
      (event: string, handler: (payload: unknown) => void) => {
        eventHandlers.set(event, handler);
      },
    );
    mockIsGameRunning.mockResolvedValue({
      status: 'success',
      message: 'ok',
      running: false,
    });
    mockLaunchGame.mockResolvedValue({
      status: 'success',
      message: 'Game launched',
    });
    mockStopGame.mockResolvedValue({
      status: 'success',
      message: 'Game stopped',
    });

    useGameStore.setState({
      running: false,
      starting: false,
      sessions: [],
      selectedSessionId: null,
      maxLogs: 5000,
      serverPort: null,
    });
  });

  it('blocks duplicate launch calls while the game is starting', async () => {
    const deferred = createDeferred<{ status: string; message: string }>();
    mockLaunchGame.mockReturnValueOnce(deferred.promise);

    useGameStore.getState().initialize();
    await flushPromises();

    const firstLaunch = useGameStore.getState().launch();
    expect(useGameStore.getState().starting).toBe(true);
    expect(mockLaunchGame).toHaveBeenCalledTimes(1);

    await useGameStore.getState().launch();
    expect(mockLaunchGame).toHaveBeenCalledTimes(1);

    deferred.resolve({ status: 'success', message: 'Game launched' });
    await firstLaunch;

    expect(useGameStore.getState().starting).toBe(true);
    eventHandlers.get('game:status')?.('running');
    expect(useGameStore.getState().starting).toBe(false);
    expect(useGameStore.getState().running).toBe(true);
  });

  it('clears starting when launch fails', async () => {
    mockLaunchGame.mockResolvedValueOnce({
      status: 'error',
      message: 'boom',
    });

    useGameStore.getState().initialize();
    await flushPromises();

    await expect(useGameStore.getState().launch()).rejects.toThrow('boom');
    expect(useGameStore.getState().starting).toBe(false);
    expect(useGameStore.getState().running).toBe(false);
  });
});
