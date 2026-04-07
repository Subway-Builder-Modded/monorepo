import { notFound, redirect } from 'next/navigation';
import { loadRegistryAnalytics } from '@/lib/registry-analytics';

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const data = loadRegistryAnalytics();
  const params = data.allTime.map((row) => ({
    type: row.listing_type,
    id: row.id,
  }));
  if (params.length > 0) return params;
  return [
    { type: 'mod', id: '__registry-data-unavailable__' },
    { type: 'map', id: '__registry-data-unavailable__' },
  ];
}

export default async function RegistrySingularListingRedirect({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (type === 'map') {
    redirect(`/registry/maps/${encodeURIComponent(id)}`);
  }
  if (type === 'mod') {
    redirect(`/registry/mods/${encodeURIComponent(id)}`);
  }
  notFound();
}
