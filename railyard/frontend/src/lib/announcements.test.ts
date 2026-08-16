import { describe, expect, it } from 'vitest';

import {
  ANNOUNCEMENTS,
  getLatestAnnouncement,
  getUnseenAnnouncement,
} from '@/lib/announcements';

describe('announcements', () => {
  it('declares unique, non-empty ids because acknowledgement is keyed by them', () => {
    const ids = ANNOUNCEMENTS.map((announcement) => announcement.id);

    expect(ids.every((id) => id.trim().length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every announcement a title and summary, which the dialog always renders', () => {
    for (const announcement of ANNOUNCEMENTS) {
      expect(announcement.title.trim().length).toBeGreaterThan(0);
      expect(announcement.summary.trim().length).toBeGreaterThan(0);
    }
  });

  it('surfaces the newest unacknowledged announcement', () => {
    expect(getUnseenAnnouncement([])).toEqual(
      ANNOUNCEMENTS[ANNOUNCEMENTS.length - 1],
    );
  });

  it('surfaces nothing once every announcement is acknowledged', () => {
    const allIds = ANNOUNCEMENTS.map((announcement) => announcement.id);

    expect(getUnseenAnnouncement(allIds)).toBeUndefined();
  });

  it('ignores acknowledgements of announcements that no longer exist', () => {
    expect(getUnseenAnnouncement(['retired-announcement-id'])).toEqual(
      ANNOUNCEMENTS[ANNOUNCEMENTS.length - 1],
    );
  });

  // The re-entry points open the latest announcement whether or not it was acknowledged.
  it('always resolves a latest announcement for the re-entry points', () => {
    expect(getLatestAnnouncement()).toEqual(
      ANNOUNCEMENTS[ANNOUNCEMENTS.length - 1],
    );
  });
});
