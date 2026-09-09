import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Announcement } from '@/lib/announcements';

import { useAnnouncementStore } from './announcement-store';

const { mockGetSeenAnnouncements, mockMarkAnnouncementSeen } = vi.hoisted(
  () => ({
    mockGetSeenAnnouncements: vi.fn(),
    mockMarkAnnouncementSeen: vi.fn(),
  }),
);

vi.mock('../../wailsjs/go/main/App', () => ({
  GetSeenAnnouncements: mockGetSeenAnnouncements,
  MarkAnnouncementSeen: mockMarkAnnouncementSeen,
}));

const { mockGetUnseenAnnouncement, mockGetLatestAnnouncement } = vi.hoisted(
  () => ({
    mockGetUnseenAnnouncement: vi.fn(),
    mockGetLatestAnnouncement: vi.fn(),
  }),
);

vi.mock('@/lib/announcements', () => ({
  getUnseenAnnouncement: mockGetUnseenAnnouncement,
  getLatestAnnouncement: mockGetLatestAnnouncement,
}));

const announcement: Announcement = {
  id: 'a-1',
  title: 'Test announcement',
  summary: 'Supporting context',
};

beforeEach(() => {
  vi.clearAllMocks();
  useAnnouncementStore.setState({
    seen: [],
    initialized: false,
    active: null,
  });
});

describe('useAnnouncementStore', () => {
  it('initializes from the backend record once', async () => {
    mockGetSeenAnnouncements.mockResolvedValue({ status: 'ok', seen: ['a-0'] });

    await useAnnouncementStore.getState().initialize();
    expect(useAnnouncementStore.getState()).toMatchObject({
      seen: ['a-0'],
      initialized: true,
    });

    await useAnnouncementStore.getState().initialize();
    expect(mockGetSeenAnnouncements).toHaveBeenCalledTimes(1);
  });

  it('does not latch initialized when the backend read errors', async () => {
    mockGetSeenAnnouncements.mockResolvedValue({ status: 'error', seen: [] });
    await useAnnouncementStore.getState().initialize();
    expect(useAnnouncementStore.getState().initialized).toBe(false);

    mockGetSeenAnnouncements.mockRejectedValue(new Error('ipc down'));
    await useAnnouncementStore.getState().initialize();
    expect(useAnnouncementStore.getState().initialized).toBe(false);
  });

  it('shows the unseen announcement, without replacing an active one', () => {
    mockGetUnseenAnnouncement.mockReturnValue(announcement);
    useAnnouncementStore.getState().showUnseen();
    expect(useAnnouncementStore.getState().active).toBe(announcement);

    const other = { ...announcement, id: 'a-2' };
    mockGetUnseenAnnouncement.mockReturnValue(other);
    useAnnouncementStore.getState().showUnseen();
    expect(useAnnouncementStore.getState().active).toBe(announcement);
  });

  it('stays hidden when everything is acknowledged', () => {
    mockGetUnseenAnnouncement.mockReturnValue(undefined);
    useAnnouncementStore.getState().showUnseen();
    expect(useAnnouncementStore.getState().active).toBeNull();
  });

  it('shows the latest announcement regardless of acknowledgement', () => {
    mockGetLatestAnnouncement.mockReturnValue(announcement);
    useAnnouncementStore.getState().showLatest();
    expect(useAnnouncementStore.getState().active).toBe(announcement);
  });

  it('dismiss records acknowledgement through the backend', async () => {
    mockMarkAnnouncementSeen.mockResolvedValue({
      status: 'ok',
      seen: ['a-1'],
    });
    useAnnouncementStore.setState({ active: announcement });

    await useAnnouncementStore.getState().dismiss();
    expect(useAnnouncementStore.getState().active).toBeNull();
    expect(mockMarkAnnouncementSeen).toHaveBeenCalledWith('a-1');
    expect(useAnnouncementStore.getState().seen).toEqual(['a-1']);
  });

  it('dismiss leaves seen untouched when the backend write fails', async () => {
    mockMarkAnnouncementSeen.mockRejectedValue(new Error('write failed'));
    useAnnouncementStore.setState({ active: announcement });

    await useAnnouncementStore.getState().dismiss();
    expect(useAnnouncementStore.getState().active).toBeNull();
    expect(useAnnouncementStore.getState().seen).toEqual([]);
  });

  it('dismiss skips the backend when already acknowledged', async () => {
    useAnnouncementStore.setState({ active: announcement, seen: ['a-1'] });
    await useAnnouncementStore.getState().dismiss();
    expect(mockMarkAnnouncementSeen).not.toHaveBeenCalled();
  });
});
