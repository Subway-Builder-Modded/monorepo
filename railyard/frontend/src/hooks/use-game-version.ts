import { useEffect, useState } from 'react';

import { GetGameVersion } from '../../wailsjs/go/main/App';

// useGameVersion returns the installed Subway Builder version, re-fetching on mount and
// whenever the window regains focus. The game can be updated while Railyard stays open,
// so an already-open page picks up the new version (and refreshed compatibility) on focus.
export function useGameVersion(): string {
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

    fetchGameVersion();
    window.addEventListener('focus', fetchGameVersion);
    return () => window.removeEventListener('focus', fetchGameVersion);
  }, []);

  return gameVersion;
}
