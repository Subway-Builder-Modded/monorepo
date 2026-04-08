import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { DocsSidebarShell } from '@/features/docs/components/docs-sidebar';
import { resolveDocsRouteForInstance } from '@/lib/docs/shared';
import { getAllDocsDocSlugs, getSidebarTree } from '@/lib/docs/server';

export default async function DocsCatchAllLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ instance: string; slug?: string[] }>;
}) {
  const { instance: instanceId, slug } = await params;
  const normalizedSlug = slug?.filter(Boolean);
  const resolved = resolveDocsRouteForInstance(instanceId, slug);

  if (!resolved) notFound();

  if (!normalizedSlug?.length) {
    return <section className="w-full px-4 pb-12 md:px-6">{children}</section>;
  }

  const tree = await getSidebarTree(resolved.instance, resolved.version);

  const allSlugs = await getAllDocsDocSlugs();

  const versionDocSlugs = resolved.instance.versioned
    ? Object.fromEntries(
        (resolved.instance.versions ?? []).map((version) => [
          version.value,
          allSlugs
            .filter(
              (parts) =>
                parts[0] === resolved.instance.id && parts[1] === version.value,
            )
            .map((parts) => parts.slice(2).join('/'))
            .filter(Boolean),
        ]),
      )
    : {};

  return (
    <section className="w-full">
      <DocsSidebarShell tree={tree} versionDocSlugs={versionDocSlugs}>
        <div className="w-full px-5 pt-6 pb-16 md:px-8 md:pt-6 md:pb-16 xl:pr-6 2xl:pr-4">
          {children}
        </div>
      </DocsSidebarShell>
    </section>
  );
}
