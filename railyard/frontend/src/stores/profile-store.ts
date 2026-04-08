import { create } from 'zustand';

import type { AssetType } from '@/lib/asset-types';
import {
  normalizeSearchViewMode,
  type SearchViewMode,
} from '@/lib/search-view-mode';

import type { types } from '../../wailsjs/go/models';
import {
  GetActiveProfile,
  ResetUserProfiles,
  UpdateSystemPreferences,
  UpdateUIPreferences,
} from '../../wailsjs/go/profiles/UserProfiles';

interface UIPreferencesPayload {
  theme: string;
  defaultPerPage: number;
  searchViewMode: SearchViewMode;
}

interface UpdateSystemPreferencesPayload {
  refreshRegistryOnStartup?: boolean;
  autoUpdateSubscriptions?: boolean;
  extraMemorySize?: number;
  useDevTools?: boolean;
}

const DEFAULT_UI_PREFERENCES: UIPreferencesPayload = {
  theme: 'dark',
  defaultPerPage: 12,
  searchViewMode: 'full',
};

function resolveUIPreferences(
  profile: types.UserProfile | null,
): UIPreferencesPayload {
  const uiPreferences = profile?.uiPreferences as
    | (types.UIPreferences & { searchViewMode?: unknown })
    | undefined;

  return {
    theme: uiPreferences?.theme ?? DEFAULT_UI_PREFERENCES.theme,
    defaultPerPage:
      uiPreferences?.defaultPerPage ?? DEFAULT_UI_PREFERENCES.defaultPerPage,
    searchViewMode: normalizeSearchViewMode(
      uiPreferences?.searchViewMode,
      DEFAULT_UI_PREFERENCES.searchViewMode,
    ),
  };
}

function resolveSystemPreferences(
  profile: types.UserProfile | null,
): types.SystemPreferences {
  return {
    refreshRegistryOnStartup:
      profile?.systemPreferences?.refreshRegistryOnStartup ?? false,
    autoUpdateSubscriptions:
      profile?.systemPreferences?.autoUpdateSubscriptions ?? false,
    extraMemorySize: profile?.systemPreferences?.extraMemorySize ?? 0,
    useDevTools: profile?.systemPreferences?.useDevTools ?? false,
  };
}

interface ProfileState {
  profile: types.UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  refreshActiveProfile: () => Promise<void>;
  isSubscribed: (type: AssetType, id: string) => boolean;
  theme: () => string;
  defaultPerPage: () => number;
  searchViewMode: () => SearchViewMode;
  updateUIPreferences: (
    updates: Partial<UIPreferencesPayload>,
  ) => Promise<void>;
  resetProfile: () => Promise<void>;
  updateSystemPreferences: (
    preferences: Partial<UpdateSystemPreferencesPayload>,
  ) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      await get().refreshActiveProfile();
      set({ initialized: true, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        initialized: true,
        loading: false,
      });
    }
  },

  refreshActiveProfile: async () => {
    const result = await GetActiveProfile();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to load active profile');
    }
    set({ profile: result.profile, error: null });
  },

  isSubscribed: (type: AssetType, id: string) => {
    const profile = get().profile;
    if (!profile?.subscriptions) return false;
    if (type === 'mod') {
      const modSubscriptions = profile.subscriptions.mods ?? {};
      return id in modSubscriptions;
    }

    const mapSubscriptions = profile.subscriptions.maps ?? {};
    const localMapSubscriptions = profile.subscriptions.localMaps ?? {};
    return id in mapSubscriptions || id in localMapSubscriptions;
  },

  theme: () => resolveUIPreferences(get().profile).theme,
  defaultPerPage: () => resolveUIPreferences(get().profile).defaultPerPage,
  searchViewMode: () => resolveUIPreferences(get().profile).searchViewMode,

  updateUIPreferences: async (updates) => {
    const nextPreferences: UIPreferencesPayload = {
      ...resolveUIPreferences(get().profile),
      ...updates,
    };

    const result = await UpdateUIPreferences(
      nextPreferences as unknown as types.UIPreferences,
    );
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to update UI preferences');
    }
    set({ profile: result.profile });
  },

  resetProfile: async () => {
    set({ loading: true, error: null });
    try {
      const resetResult = await ResetUserProfiles();
      set({ profile: resetResult.profile, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        loading: false,
      });
    }
  },

  updateSystemPreferences: async (preferences) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        ...resolveSystemPreferences(get().profile),
        ...preferences,
      };
      const result = await UpdateSystemPreferences(payload);
      if (result.status === 'error') {
        throw new Error(
          result.message || 'Failed to update system preferences',
        );
      }
      set({ profile: result.profile, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        loading: false,
      });
    }
  },
}));
