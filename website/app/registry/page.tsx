import type { Metadata } from 'next';
import { loadRegistryAnalytics } from '@/lib/registry-analytics';
import { RegistryAnalyticsPage } from '@/features/registry/components/registry-analytics-page';
import { buildEmbedMetadata } from '@/config/site/metadata';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Registry',
  description: 'In-depth analytics and insights for Railyard-hosted content.',
});

export default function RegistryPage() {
  const data = loadRegistryAnalytics();
  return <RegistryAnalyticsPage data={data} />;
}
