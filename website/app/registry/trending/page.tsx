import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@/config/site/metadata';
import { RegistryTrendingPage } from '@/features/registry/components/registry-trending-page';
import {
  loadAllListingDailyData,
  loadRegistryAnalytics,
} from '@/lib/registry-analytics';

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
