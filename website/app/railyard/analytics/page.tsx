import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@sbm/website/config/site/metadata';
import { RailyardAnalyticsPage } from '@sbm/website/features/railyard/components/railyard-analytics-page';
import { loadRailyardAnalytics } from '@sbm/website/lib/railyard-analytics';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Analytics | Railyard',
  description:
    'In-depth release and download analytics for the Railyard desktop app.',
});

export default function RailyardAnalyticsPageRoute() {
  const data = loadRailyardAnalytics();
  return <RailyardAnalyticsPage data={data} />;
}
