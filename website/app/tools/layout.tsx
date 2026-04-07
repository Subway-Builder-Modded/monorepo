import type { Metadata } from 'next';
import { buildEmbedMetadata } from '@/config/site/metadata';

export const metadata: Metadata = buildEmbedMetadata({
  title: 'Tools',
  description:
    'A utility suite for formatting, conversion, and workflow helpers used across Subway Builder Modded content.',
});

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
