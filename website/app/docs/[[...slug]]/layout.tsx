import type { ReactNode } from 'react';

export default async function DocsCatchAllLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  return children;
}
