import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@/config/site/metadata';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Railyard',
  description: 'The all-in-one map and mod manager for Subway Builder.',
});

export default function RailyardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
