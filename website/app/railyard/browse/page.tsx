import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrowsePage } from '@/features/railyard/components/browse-page';
import { buildEmbedMetadata } from '@/config/site/metadata';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Browse | Railyard',
  description:
    'Discover and install community-made content for Subway Builder.',
});

export default function BrowseRoutePage() {
  return (
    <div
      data-sidebar-host
      className="railyard-accent px-6 py-8 max-w-screen-xl mx-auto"
    >
      <Suspense fallback={null}>
        <BrowsePage />
      </Suspense>
    </div>
  );
}
