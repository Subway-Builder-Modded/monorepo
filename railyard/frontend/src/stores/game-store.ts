import { create } from 'zustand';

import { IsGameRunning, LaunchGame, StopGame } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';

// Launch failures that warrant a guided dialog rather than a generic error toast. These mirror
// the backend's GameLaunchErrorType codes (see types.GameLaunchErrorType).
export const STEAM_NOT_RUNNING = 'steam_not_running';
export const STEAM_DISCOVERY_TIMEOUT = 'steam_discovery_timeout';

export interface LaunchBlock {
  errorType: typeof STEAM_NOT_RUNNING | typeof STEAM_DISCOVERY_TIMEOUT;
  message: string;
}

export interface LogEntry {
  stream: 'stdout' | 'stderr';
  line: string;
  timestamp: number;
}

export interface GameLogSession {
  id: string;
  startedAt: number;
  endedAt: number | null;
  logs: LogEntry[];
}

function createSessionId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createNewSessionPatch(
  sessions: GameLogSession[],
  startedAt: number,
  logs: LogEntry[] = [],
): { sessionId: string; sessions: GameLogSession[] } {
  const sessionId = createSessionId();
  return {
    sessionId,
    sessions: [
      ...sessions,
      {
        id: sessionId,
        startedAt,
        endedAt: null,
        logs,
      },
    ],
  };
}

interface GameState {
  running: boolean;
  starting: boolean;
  sessions: GameLogSession[];
  selectedSessionId: string | null;
  maxLogs: number;
  serverPort: number | null;
  // Set when the launch-blocked modal should show (Steam not running, or the launch is blocked by
  // a Steam dialog). Null when there is nothing to surface. Driven by the game:launch-blocked event.
  launchBlock: LaunchBlock | null;
  // True after "Keep Waiting": discovery keeps running in the background and the non-blocking
  // indicator stays up until the game appears (running) or the hard cap is reached (gave up).
  discoveryWaiting: boolean;
  // Set when discovery hits the hard cap; a component shows a toast for it and clears it.
  gaveUpMessage: string | null;

  initialize: () => void;
  launch: (skipIncompatibleMaps?: boolean) => Promise<void>;
  stop: () => Promise<void>;
  selectSession: (id: string) => void;
  clearLogs: () => void;
  // Keep Waiting: dismiss the modal but keep discovering in the background (shows the indicator).
  keepWaiting: () => void;
  // Cancel/abort the in-flight launch (also the strict action for dialog dismissal/exit).
  cancelLaunch: () => void;
  clearGaveUp: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  running: false,
  starting: false,
  sessions: [],
  selectedSessionId: null,
  maxLogs: 5000,
  serverPort: null,
  launchBlock: null,
  discoveryWaiting: false,
  gaveUpMessage: null,

  initialize: () => {
    const appendLogToSession = (stream: 'stdout' | 'stderr', line: string) => {
      const timestamp = Date.now();
      set((state) => {
        const activeIndex = state.sessions.findIndex(
          (session) => session.endedAt === null,
        );

        if (activeIndex === -1) {
          const entry: LogEntry = { stream, line, timestamp };
          const { sessionId, sessions } = createNewSessionPatch(
            state.sessions,
            timestamp,
            [entry],
          );

          return {
            selectedSessionId: sessionId,
            sessions,
          };
        }

        const nextSessions = [...state.sessions];
        const target = nextSessions[activeIndex];
        const nextLogs = [...target.logs, { stream, line, timestamp }];

        nextSessions[activeIndex] = {
          ...target,
          logs:
            nextLogs.length > state.maxLogs
              ? nextLogs.slice(-state.maxLogs)
              : nextLogs,
        };

        return {
          sessions: nextSessions,
          selectedSessionId:
            state.selectedSessionId === null ||
            state.selectedSessionId === target.id
              ? target.id
              : state.selectedSessionId,
        };
      });
    };

    // Check initial state
    IsGameRunning().then((response) => {
      if (response.status !== 'success' || !response.running) {
        set({ running: false, starting: false });
        return;
      }

      const now = Date.now();
      set((state) => {
        const hasActiveSession = state.sessions.some(
          (session) => session.endedAt === null,
        );
        if (hasActiveSession) {
          return { running: true, starting: false };
        }

        const { sessionId, sessions } = createNewSessionPatch(
          state.sessions,
          now,
        );
        return {
          running: true,
          starting: false,
          selectedSessionId: sessionId,
          sessions,
        };
      });
    });

    // Listen for events from backend
    EventsOn('game:status', (status: string) => {
      if (status === 'starting') {
        set({ starting: true });
        return;
      }

      if (status === 'running') {
        const now = Date.now();
        set((state) => {
          const hasActiveSession = state.sessions.some(
            (session) => session.endedAt === null,
          );
          if (hasActiveSession) {
            return {
              running: true,
              starting: false,
              launchBlock: null,
              discoveryWaiting: false,
            };
          }

          const { sessionId, sessions } = createNewSessionPatch(
            state.sessions,
            now,
          );
          return {
            running: true,
            starting: false,
            launchBlock: null,
            discoveryWaiting: false,
            selectedSessionId: sessionId,
            sessions,
          };
        });
        return;
      }

      set((state) => {
        const activeIndex = state.sessions.findIndex(
          (session) => session.endedAt === null,
        );
        if (activeIndex === -1) {
          return {
            running: false,
            starting: false,
            serverPort: null,
            launchBlock: null,
            discoveryWaiting: false,
          };
        }

        const nextSessions = [...state.sessions];
        nextSessions[activeIndex] = {
          ...nextSessions[activeIndex],
          endedAt: Date.now(),
        };

        return {
          running: false,
          starting: false,
          serverPort: null,
          launchBlock: null,
          discoveryWaiting: false,
          sessions: nextSessions,
        };
      });
    });

    // Discovery surfaced the blocked dialog (Steam not running, or blocked by a Steam dialog).
    EventsOn(
      'game:launch-blocked',
      (data: { errorType: string; message: string }) => {
        if (
          data.errorType === STEAM_NOT_RUNNING ||
          data.errorType === STEAM_DISCOVERY_TIMEOUT
        ) {
          set({
            launchBlock: {
              errorType: data.errorType,
              message: data.message,
            },
          });
        }
      },
    );

    // Discovery hit the hard cap: drop the dialog/indicator and let a component toast the reason.
    EventsOn('game:launch-gaveup', (data: { message: string }) => {
      set({
        launchBlock: null,
        discoveryWaiting: false,
        gaveUpMessage: data.message,
      });
    });

    EventsOn('server:port', (port: number) => {
      set({ serverPort: port });
    });

    EventsOn(
      'game:log',
      (data: { stream: 'stdout' | 'stderr'; line: string }) => {
        appendLogToSession(data.stream, data.line);
      },
    );

    EventsOn('game:exit', (exitCode: number) => {
      appendLogToSession(
        'stderr',
        exitCode === 0
          ? '--- Game exited normally ---'
          : `--- Game exited with code ${exitCode} ---`,
      );
    });
  },

  launch: async (skipIncompatibleMaps = false) => {
    if (get().running || get().starting) {
      return;
    }

    set({
      starting: true,
      launchBlock: null,
      discoveryWaiting: false,
      gaveUpMessage: null,
    });

    try {
      // For Steam this returns as soon as the launch is initiated; the discovery watcher then
      // drives the outcome via game:status / game:launch-blocked / game:launch-gaveup events.
      const response = await LaunchGame(skipIncompatibleMaps);
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to launch game');
      }
    } catch (error) {
      set({ starting: false });
      throw error;
    }
  },

  stop: async () => {
    const response = await StopGame();
    if (response.status === 'error') {
      throw new Error(response.message || 'Failed to stop game');
    }
  },

  selectSession: (id: string) => set({ selectedSessionId: id }),

  // Keep the dialog's discovery going in the background, shown by the non-blocking indicator.
  keepWaiting: () => set({ launchBlock: null, discoveryWaiting: true }),

  // Abort the in-flight launch. StopGame cancels backend discovery (or kills a running game);
  // errors are swallowed since a cancel racing the game's own exit is harmless.
  cancelLaunch: () => {
    set({ launchBlock: null, discoveryWaiting: false });
    void get()
      .stop()
      .catch(() => {});
  },

  clearGaveUp: () => set({ gaveUpMessage: null }),

  clearLogs: () =>
    set((state) => {
      if (!state.selectedSessionId) return {};

      // Never delete the currently active session
      const selected = state.sessions.find(
        (s) => s.id === state.selectedSessionId,
      );
      if (selected?.endedAt === null) return {};

      const nextSessions = state.sessions.filter(
        (session) => session.id !== state.selectedSessionId,
      );

      return {
        sessions: nextSessions,
        selectedSessionId:
          nextSessions.length > 0
            ? nextSessions[nextSessions.length - 1].id
            : null,
      };
    }),
}));
