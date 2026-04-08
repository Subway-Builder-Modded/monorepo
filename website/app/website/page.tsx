import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@sbm/website/config/site/metadata';
import { WebsiteAnalyticsPage } from '@sbm/website/features/website/components/website-analytics-page';
import { loadWebsiteAnalytics } from '@sbm/website/lib/website-analytics';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Website',
  description:
    'Central place for docs, analytics, and community resources across all Subway Builder Modded projects.',
});

export default function WebsitePageRoute() {
  const data = loadWebsiteAnalytics();
  return <WebsiteAnalyticsPage data={data} />;
}
