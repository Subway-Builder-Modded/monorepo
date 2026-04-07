import type { Metadata } from 'next';
import {
  loadListingDailyData,
  loadRegistryAnalytics,
} from '@/lib/registry-analytics';
import { RegistryListingPage } from '@/features/registry/components/registry-listing-page';
import {
  buildEmbedMetadata,
  buildNoEmbedMetadata,
} from '@/config/site/metadata';

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const data = loadRegistryAnalytics();
  const params = data.allTime
    .filter((row) => row.listing_type === 'mod')
    .map((row) => ({ id: row.id }));
  if (params.length > 0) return params;
  return [{ id: '__registry-data-unavailable__' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = loadRegistryAnalytics();
  const listing = data.allTime.find(
    (r) => r.id === id && r.listing_type === 'mod',
  );

  if (!listing) {
    return buildNoEmbedMetadata({
      title: 'Not Found | Registry',
      description: 'This registry listing could not be found.',
    });
  }

  const authorDisplay = listing.author_alias?.trim() || listing.author;
  return buildEmbedMetadata({
    title: `${listing.name} | Registry`,
    description: `Stats for ${listing.name} — a Subway Builder Modded mod by ${authorDisplay}. ${listing.total_downloads.toLocaleString()} total downloads.`,
  });
}

export default async function RegistryModsListingRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = loadRegistryAnalytics();
  const dailyData = loadListingDailyData(id);

  return (
    <RegistryListingPage
      data={data}
      type="mod"
      id={id}
      dailyData={dailyData}
      mapMetadata={null}
    />
  );
}
