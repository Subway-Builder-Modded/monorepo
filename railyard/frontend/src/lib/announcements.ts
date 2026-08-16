// In-app announcements. Copy lives here rather than in the backend, which only
// ever stores acknowledged IDs — so adding an announcement is a frontend-only change.
//
// IDs are permanent: acknowledgement is keyed by them, so revising an
// announcement's copy materially means minting a NEW id to re-show it, while
// editing in place (a typo, a link) deliberately leaves it dismissed.
export interface Announcement {
  id: string;
  /** Carries the news itself, so no subheading has to repeat it. */
  title: string;
  /** Supporting context under the title; renders muted, like any dialog description. */
  summary: string;
  /** The specifics, as a plain bulleted list at body weight. */
  bullets?: string[];
  /** Closing remarks, after the bullets. */
  closing?: string[];
  /** Attribution line. */
  signoff?: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'maintenance-mode-2026-08',
    title: 'Railyard is Entering Maintenance Mode',
    summary:
      'Due to a lack of clarity on the future of modding Subway Builder, the Railyard team will no longer be actively developing new features.',
    bullets: [
      'Bug fixes and compatibility updates will continue for the foreseeable future.',
      'No new major updates are planned.',
    ],
    closing: [
      'Thank you for using Railyard and for supporting the creators on the platform.',
      'Railyard may no longer be the focus of our efforts, but the team is sticking together for a new project — stay tuned.',
    ],
    signoff: '— The Railyard Team',
  },
];

/** The announcement shown on load, newest last; undefined once all are acknowledged. */
export function getUnseenAnnouncement(
  seen: string[],
): Announcement | undefined {
  const acknowledged = new Set(seen);
  const unseen = ANNOUNCEMENTS.filter(
    (announcement) => !acknowledged.has(announcement.id),
  );
  return unseen[unseen.length - 1];
}

/** The announcement the re-entry points open: the newest one, seen or not. */
export function getLatestAnnouncement(): Announcement | undefined {
  return ANNOUNCEMENTS[ANNOUNCEMENTS.length - 1];
}
