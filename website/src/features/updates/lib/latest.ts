type LatestEligibleUpdate = {
  id: string;
  frontmatter: {
    tag: string;
  };
};

export function findLatestBadgeEntry<T extends LatestEligibleUpdate>(entries: T[]): T | null {
  return entries.find((entry) => entry.frontmatter.tag !== "release-candidate") ?? null;
}
