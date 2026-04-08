import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@sbm/website/config/site/metadata';
import { RegistryTrendingPage } from '@sbm/website/features/registry/components/registry-trending-page';
import {
  loadAllListingDailyData,
  loadRegistryAnalytics,
} from '@sbm/website/lib/registry-analytics';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Trending | Registry',
  description:
    'The most trending content on Railyard based on recent activity.',
});

export default function RegistryTrendingRoute() {
  const data = loadRegistryAnalytics();
  const listingDailyData = loadAllListingDailyData();
  return (
    <RegistryTrendingPage data={data} listingDailyData={listingDailyData} />
  );
}
