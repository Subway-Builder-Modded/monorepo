import type {
  DailyDataPoint,
  ListingType,
  RegistryAnalyticsData,
  RegistryAuthorRow,
  RegistryListingProjectRow,
  RegistryListingRow,
  RegistryMapPopulationRow,
  RegistryTrendingRow,
} from '@/types/registry-analytics';

// Pure data-processing helpers — no fs/path, safe to import in client components.

export type ListingAnalytics = {
  allTime: RegistryListingRow | undefined;
  trend1d: RegistryTrendingRow | undefined;
  trend3d: RegistryTrendingRow | undefined;
  trend7d: RegistryTrendingRow | undefined;
  project: RegistryListingProjectRow | undefined;
  population: RegistryMapPopulationRow | undefined;
  siblings: RegistryListingRow[];
  dailyData: DailyDataPoint[];
};

export function getListingAnalytics(
  data: RegistryAnalyticsData,
  type: ListingType,
  id: string,
  dailyData: DailyDataPoint[] = [],
): ListingAnalytics {
  const allTime = data.allTime.find(
    (r) => r.id === id && r.listing_type === type,
  );
  const project = data.listingProjects.find(
    (r) => r.id === id && r.listing_type === type,
  );
  const population =
    type === 'map' ? data.mapPopulations.find((r) => r.id === id) : undefined;

  const siblingIds = project
    ? data.listingProjects
        .filter((r) => r.project_key === project.project_key && r.id !== id)
        .map((r) => r.id)
    : [];

  const siblings = data.allTime.filter((r) => siblingIds.includes(r.id));

  return {
    allTime,
    trend1d: data.trending1d.find((r) => r.id === id),
    trend3d: data.trending3d.find((r) => r.id === id),
    trend7d: data.trending7d.find((r) => r.id === id),
    project,
    population,
    siblings,
    dailyData,
  };
}

export type AuthorAnalytics = {
  author: RegistryAuthorRow | undefined;
  maps: RegistryListingRow[];
  mods: RegistryListingRow[];
  githubUsername: string | undefined;
  dailyData: DailyDataPoint[];
};

export function getAuthorAnalytics(
  data: RegistryAnalyticsData,
  author: string,
  dailyData: DailyDataPoint[] = [],
): AuthorAnalytics {
  const authorRow = data.authors.find(
    (a) => a.author.toLowerCase() === author.toLowerCase(),
  );
  const allAuthorListings = data.allTime.filter(
    (r) => r.author.toLowerCase() === author.toLowerCase(),
  );

  const projectKey = data.listingProjects.find((r) =>
    r.project_key.toLowerCase().startsWith(author.toLowerCase() + '/'),
  );
  const githubUsername = projectKey
    ? projectKey.project_key.split('/')[0]
    : undefined;

  return {
    author: authorRow,
    maps: allAuthorListings.filter((r) => r.listing_type === 'map'),
    mods: allAuthorListings.filter((r) => r.listing_type === 'mod'),
    githubUsername,
    dailyData,
  };
}
