import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@/config/site/metadata';
import { PlaygroundPage } from '@/features/tools/components/playground-page';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Markdown Playground | Tools',
  description: 'Compose rich text and instantly export clean Markdown.',
});

export default function PlaygroundRoute() {
  return <PlaygroundPage />;
}
