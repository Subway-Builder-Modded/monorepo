import type { Metadata } from 'next';
import {
  loadAuthorDailyData,
  loadRegistryAnalytics,
} from '@/lib/registry-analytics';
import { RegistryAuthorPage } from '@/features/registry/components/registry-author-page';
import {
  buildEmbedMetadata,
  buildNoEmbedMetadata,
} from '@/config/site/metadata';

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const data = loadRegistryAnalytics();
  const params = data.authors.map((authorRow) => ({
    author: authorRow.author,
  }));
  if (params.length > 0) return params;
  return [{ author: '__registry-data-unavailable__' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>;
}): Promise<Metadata> {
  const { author } = await params;
  const data = loadRegistryAnalytics();
  const authorRow = data.authors.find(
    (row) => row.author.toLowerCase() === author.toLowerCase(),
  );

  if (!authorRow) {
    return buildNoEmbedMetadata({
      title: 'Not Found | Registry',
      description: 'This author could not be found.',
    });
  }

  const displayName = authorRow.author_alias?.trim() || authorRow.author;
  return buildEmbedMetadata({
    title: `${displayName} | Registry`,
    description: `Registry stats for ${displayName} — ${authorRow.asset_count} listing${authorRow.asset_count !== 1 ? 's' : ''} with ${authorRow.total_downloads.toLocaleString()} total downloads.`,
  });
}

export default async function RegistryAuthorsRoute({
  params,
}: {
  params: Promise<{ author: string }>;
}) {
  const { author } = await params;
  const data = loadRegistryAnalytics();
  const dailyData = loadAuthorDailyData(author);
  return (
    <RegistryAuthorPage data={data} author={author} dailyData={dailyData} />
  );
}
