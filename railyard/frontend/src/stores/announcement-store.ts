import { create } from 'zustand';

import {
  type Announcement,
  getLatestAnnouncement,
  getUnseenAnnouncement,
} from '@/lib/announcements';

import {
  GetSeenAnnouncements,
  MarkAnnouncementSeen,
} from '../../wailsjs/go/main/App';

interface AnnouncementState {
  /** Acknowledged announcement IDs, read from the backend record. */
  seen: string[];
  initialized: boolean;
  /** The announcement currently on screen, or null. */
  active: Announcement | null;
  initialize: () => Promise<void>;
  /** Shows the announcement awaiting acknowledgement, if any. Safe to call repeatedly. */
  showUnseen: () => void;
  /** Shows the newest announcement regardless of acknowledgement, for the re-entry points. */
  showLatest: () => void;
  dismiss: () => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  seen: [],
  initialized: false,
  active: null,

  initialize: async () => {
    if (get().initialized) return;
    try {
      const result = await GetSeenAnnouncements();
      // A failed read must not mark anything acknowledged, or the record would
      // be overwritten and every announcement would replay on the next launch.
      set({ seen: result.seen ?? [], initialized: result.status !== 'error' });
    } catch {
      set({ initialized: false });
    }
  },

  showUnseen: () => {
    if (get().active) return;
    const unseen = getUnseenAnnouncement(get().seen);
    if (unseen) set({ active: unseen });
  },

  showLatest: () => {
    const latest = getLatestAnnouncement();
    if (latest) set({ active: latest });
  },

  dismiss: async () => {
    const active = get().active;
    set({ active: null });
    if (!active || get().seen.includes(active.id)) return;
    try {
      const result = await MarkAnnouncementSeen(active.id);
      if (result.status !== 'error') set({ seen: result.seen ?? [] });
    } catch {
      // Leave `seen` untouched so the announcement returns next launch.
    }
  },
}));
