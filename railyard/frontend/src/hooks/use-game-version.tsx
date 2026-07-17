import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { measureAsync } from '@/lib/perf';
import { useConfigStore } from '@/stores/config-store';

import { GetGameVersion } from '../../wailsjs/go/main/App';

const GameVersionContext = createContext<string>('');

// Skip focus refetch if we detected recently: a game can only update while it isn't running,
// so checking at most this often still picks up an update promptly without an IPC on every re-focus.
const FOCUS_REFETCH_INTERVAL_MS = 60_000; // Poll every minute

// GameVersionProvider shares one detected Subway Builder version across the app.
export function GameVersionProvider({ children }: { children: ReactNode }) {
  const [gameVersion, setGameVersion] = useState<string>('');
  // The detected version depends on where the game is resolved from; re-detect immediately when
  // launch configuration changes (e.g. the Use Steam toggle) instead of waiting for a focus poll.
  const useSteamLaunch = useConfigStore(
    (s) => s.config?.useSteamLaunch ?? false,
  );
  const executablePath = useConfigStore((s) => s.config?.executablePath ?? '');
  const steamLibraryPath = useConfigStore(
    (s) => s.config?.defaultSteamLibraryPath ?? '',
  );

  useEffect(() => {
    let lastFetchedAt = 0;
    const fetchGameVersion = () => {
      lastFetchedAt = Date.now();
      measureAsync('gameVersion.detect', () => GetGameVersion())
        .then((response) => {
          if (response.status === 'success') {
            setGameVersion(response.version || '');
          }
        })
        .catch(() => {});
    };

    // Detection is centralized so a page mounting several consumers fires one detection call.
    fetchGameVersion();
    // Re-fetch on focus so an open page picks up a game update that happened while
    // Railyard was running without re-detecting on every window focus.
    const onFocus = () => {
      if (Date.now() - lastFetchedAt < FOCUS_REFETCH_INTERVAL_MS) return;
      fetchGameVersion();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [useSteamLaunch, executablePath, steamLibraryPath]);

  return (
    <GameVersionContext.Provider value={gameVersion}>
      {children}
    </GameVersionContext.Provider>
  );
}

// useGameVersion reads the shared game version from GameVersionProvider.
export function useGameVersion(): string {
  return useContext(GameVersionContext);
}
