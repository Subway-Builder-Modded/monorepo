import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectPage } from '@/features/railyard/components/project-page';
import { buildNoEmbedMetadata } from '@/config/site/metadata';
import {
  buildRailyardProjectEmbedMetadata,
  getRegistryStaticIds,
} from '@/lib/railyard/registry.server';

export async function generateStaticParams() {
  const ids = await getRegistryStaticIds('mods');
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const metadata = await buildRailyardProjectEmbedMetadata({
    type: 'mods',
    id,
  });

  return (
    metadata ??
    buildNoEmbedMetadata({
      title: 'Not Found | Railyard',
      description: 'This Railyard project could not be found.',
    })
  );
}

export default async function ModProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ProjectPage type="mods" id={id} />
    </Suspense>
  );
}
