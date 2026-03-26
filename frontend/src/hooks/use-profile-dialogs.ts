import { useCallback, useMemo, useState } from 'react';

import type { types } from '../../wailsjs/go/models';

type ProfileDialogsState = {
  create: {
    open: boolean;
    name: string;
    loading: boolean;
  };
  rename: {
    target: types.UserProfile | null;
    name: string;
    loading: boolean;
  };
  remove: {
    target: types.UserProfile | null;
    loading: boolean;
  };
  swap: {
    target: types.UserProfile | null;
    loading: boolean;
    archiveWarningOpen: boolean;
  };
};

const INITIAL_PROFILE_DIALOGS_STATE: ProfileDialogsState = {
  create: {
    open: false,
    name: '',
    loading: false,
  },
  rename: {
    target: null,
    name: '',
    loading: false,
  },
  remove: {
    target: null,
    loading: false,
  },
  swap: {
    target: null,
    loading: false,
    archiveWarningOpen: false,
  },
};

export function useProfileDialogs() {
  const [dialogs, setDialogs] = useState(INITIAL_PROFILE_DIALOGS_STATE);

  const patchSection = useCallback(
    <K extends keyof ProfileDialogsState>(
      key: K,
      patch: Partial<ProfileDialogsState[K]>,
    ) => {
      setDialogs((state) => ({
        ...state,
        [key]: {
          ...state[key],
          ...patch,
        },
      }));
    },
    [],
  );

  const resetSection = useCallback(<K extends keyof ProfileDialogsState>(key: K) => {
    setDialogs((state) => ({
      ...state,
      [key]: INITIAL_PROFILE_DIALOGS_STATE[key],
    }));
  }, []);

  const create = useMemo(
    () => ({
      open: () => patchSection('create', { open: true }),
      setOpen: (open: boolean) => patchSection('create', { open }),
      setName: (name: string) => patchSection('create', { name }),
      setLoading: (loading: boolean) => patchSection('create', { loading }),
      reset: () => resetSection('create'),
    }),
    [patchSection, resetSection],
  );

  const rename = useMemo(
    () => ({
      open: (target: types.UserProfile) =>
        setDialogs((state) => ({
          ...state,
          rename: {
            target,
            name: target.name,
            loading: false,
          },
        })),
      close: () => resetSection('rename'),
      setName: (name: string) => patchSection('rename', { name }),
      setLoading: (loading: boolean) => patchSection('rename', { loading }),
    }),
    [patchSection, resetSection],
  );

  const remove = useMemo(
    () => ({
      open: (target: types.UserProfile) =>
        setDialogs((state) => ({
          ...state,
          remove: {
            target,
            loading: false,
          },
        })),
      close: () => resetSection('remove'),
      setLoading: (loading: boolean) => patchSection('remove', { loading }),
    }),
    [patchSection, resetSection],
  );

  const swap = useMemo(
    () => ({
      open: (target: types.UserProfile) =>
        setDialogs((state) => ({
          ...state,
          swap: {
            target,
            loading: false,
            archiveWarningOpen: false,
          },
        })),
      close: () => resetSection('swap'),
      setLoading: (loading: boolean) => patchSection('swap', { loading }),
      setArchiveWarningOpen: (open: boolean) =>
        patchSection('swap', { archiveWarningOpen: open }),
    }),
    [patchSection, resetSection],
  );

  return { dialogs, create, rename, remove, swap };
}
