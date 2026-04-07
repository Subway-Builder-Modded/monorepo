import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChangelogPage } from '@/features/railyard/components/changelog-page';
import { buildNoEmbedMetadata } from '@/config/site/metadata';
import {
  buildRailyardProjectEmbedMetadata,
  getRegistryStaticVersionParams,
} from '@/lib/railyard/registry.server';

export async function generateStaticParams(): Promise<
  { id: string; version: string }[]
> {
  return getRegistryStaticVersionParams('maps');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}): Promise<Metadata> {
  const { id, version } = await params;
  const decodedVersion = decodeURIComponent(version);
  const metadata = await buildRailyardProjectEmbedMetadata({
    type: 'maps',
    id,
    version: decodedVersion,
  });

  return (
    metadata ??
    buildNoEmbedMetadata({
      title: 'Not Found | Railyard',
      description: 'This changelog could not be found.',
    })
  );
}

export default async function MapChangelogPage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version } = await params;
  return (
    <Suspense fallback={null}>
      <ChangelogPage
        type="maps"
        id={id}
        version={decodeURIComponent(version)}
      />
    </Suspense>
  );
}
