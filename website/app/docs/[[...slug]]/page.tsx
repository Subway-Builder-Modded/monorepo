import { notFound } from 'next/navigation';
import { buildEmbedMetadata } from '@/config/site/metadata';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: [] as string[] }];
}

export const metadata = buildEmbedMetadata({
  title: 'Docs | Subway Builder Modded',
  description: 'Documentation for Subway Builder Modded projects.',
});

export default function LegacyDocsRoutePage() {
  notFound();
}
