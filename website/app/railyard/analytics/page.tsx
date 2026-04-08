import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@/config/site/metadata';
import { RailyardAnalyticsPage } from '@/features/railyard/components/railyard-analytics-page';
import { loadRailyardAnalytics } from '@/lib/railyard-analytics';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Analytics | Railyard',
  description:
    'In-depth release and download analytics for the Railyard desktop app.',
});

export default function RailyardAnalyticsPageRoute() {
  const data = loadRailyardAnalytics();
  return <RailyardAnalyticsPage data={data} />;
}
