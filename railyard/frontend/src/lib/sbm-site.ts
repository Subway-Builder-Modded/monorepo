export const SBM_SITE_ORIGIN = 'https://subwaybuildermodded.com';

/** Absolute URL of an author's profile page on the SBM website. */
export function sbmAuthorUrl(authorId: string): string {
  return `${SBM_SITE_ORIGIN}/registry/authors/${encodeURIComponent(authorId)}`;
}
