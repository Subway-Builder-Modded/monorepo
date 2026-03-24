import { create } from 'zustand';

interface UIState {
  settingsTab: string;
  browseSidebarOpen: boolean;
  librarySidebarOpen: boolean;
  projectTabs: Record<string, string>;
  setSettingsTab: (tab: string) => void;
  setBrowseSidebarOpen: (open: boolean) => void;
  setLibrarySidebarOpen: (open: boolean) => void;
  setProjectTab: (key: string, tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsTab: 'general',
  browseSidebarOpen: true,
  librarySidebarOpen: true,
  projectTabs: {},
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setBrowseSidebarOpen: (open) => set({ browseSidebarOpen: open }),
  setLibrarySidebarOpen: (open) => set({ librarySidebarOpen: open }),
  setProjectTab: (key, tab) =>
    set((s) => ({ projectTabs: { ...s.projectTabs, [key]: tab } })),
}));
