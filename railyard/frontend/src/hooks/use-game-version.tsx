import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { GetGameVersion } from '../../wailsjs/go/main/App';

const GameVersionContext = createContext<string>('');

// GameVersionProvider shares one detected Subway Builder version across the app.
export function GameVersionProvider({ children }: { children: ReactNode }) {
  const [gameVersion, setGameVersion] = useState<string>('');

  useEffect(() => {
    const fetchGameVersion = () => {
      GetGameVersion()
        .then((response) => {
          if (response.status === 'success') {
            setGameVersion(response.version || '');
          }
        })
        .catch(() => {});
    };

    // Detection is centralized; GetGameVersion is intentionally uncached and re-reads app.asar off disk on every call
    // Therefore, a page mounting several consumers would otherwise fire one detection call for each.
    fetchGameVersion();
    // Re-fetch on focus so an open page picks up a game update (and refreshed compatibility) that happened while Railyard ran.
    window.addEventListener('focus', fetchGameVersion);
    return () => window.removeEventListener('focus', fetchGameVersion);
  }, []);

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
