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
import { getRegistryManifest } from '@/lib/railyard/registry.server';
import type { MapManifest } from '@/types/registry';

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const data = loadRegistryAnalytics();
  const params = data.allTime
    .filter((row) => row.listing_type === 'map')
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
    (r) => r.id === id && r.listing_type === 'map',
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
    description: `Stats for ${listing.name} — a Subway Builder Modded map by ${authorDisplay}. ${listing.total_downloads.toLocaleString()} total downloads.`,
  });
}

export default async function RegistryMapsListingRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = loadRegistryAnalytics();
  const dailyData = loadListingDailyData(id);
  const manifest = await getRegistryManifest('maps', id);
  const mapManifest = manifest as MapManifest | null;
  const mapMetadata = mapManifest
    ? {
        dataQuality: mapManifest.source_quality ?? null,
        levelOfDetail: mapManifest.level_of_detail ?? null,
      }
    : null;

  return (
    <RegistryListingPage
      data={data}
      type="map"
      id={id}
      dailyData={dailyData}
      mapMetadata={mapMetadata}
    />
  );
}
