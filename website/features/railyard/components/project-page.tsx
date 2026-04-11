'use client';

import { AlignLeft, CircleAlert, History, Images } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  EmptyState,
  MarkdownPanel,
  ProjectTabs,
} from '@subway-builder-modded/asset-listings-ui';
import { Skeleton } from '@subway-builder-modded/shared-ui';

import { ProjectGallery } from '@/features/railyard/components/project-gallery';
import { ProjectHeader } from '@/features/railyard/components/project-header';
import { ProjectVersions } from '@/features/railyard/components/project-versions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useRegistryItem } from '@/hooks/use-registry-item';
import { useVersions } from '@/hooks/use-versions';
import { fetchRegistryJsonWithFallback } from '@/lib/railyard/registry-source';
import {
  mergeVersionDownloads,
  withZeroDownloads,
} from '@subway-builder-modded/asset-listings-ui';
import type {
  AssetDownloadCountsByVersion,
  RegistryIntegrityReport,
  VersionInfo,
} from '@/types/registry';

interface ProjectPageProps {
  type: 'mods' | 'maps';
  id: string;
}

async function fetchIntegrity(
  type: 'mods' | 'maps',
): Promise<RegistryIntegrityReport | null> {
  try {
    return await fetchRegistryJsonWithFallback<RegistryIntegrityReport>(
      `${type}/integrity.json`,
    );
  } catch {
    return null;
  }
}

async function fetchDownloadCounts(
  type: 'mods' | 'maps',
): Promise<AssetDownloadCountsByVersion> {
  try {
    return await fetchRegistryJsonWithFallback<AssetDownloadCountsByVersion>(
      `${type}/downloads.json`,
    );
  } catch {
    return {};
  }
}

export function ProjectPage({ type, id }: ProjectPageProps) {
  const {
    item,
    loading: itemLoading,
    error: itemError,
  } = useRegistryItem(type, id);
  const {
    versions: fetchedVersions,
    loading: versionsLoading,
    error: versionsError,
  } = useVersions(item?.update);

  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [activeTab, setActiveTab] = useState('description');

  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const browseHref = useMemo(() => {
    if (!from) return '/railyard/browse';
    const decoded = decodeURIComponent(from);
    return decoded.startsWith('/railyard/browse')
      ? decoded
      : '/railyard/browse';
  }, [from]);

  useEffect(() => {
    let cancelled = false;

    async function buildDisplayVersions() {
      if (!item) {
        setVersions([]);
        return;
      }

      const visibleVersions =
        type === 'mods'
          ? fetchedVersions.filter((version) => Boolean(version.manifest))
          : fetchedVersions;

      const [integrity, countsByAsset] = await Promise.all([
        fetchIntegrity(type),
        fetchDownloadCounts(type),
      ]);

      let mergedVersions = withZeroDownloads(visibleVersions);
      const countsForAsset = countsByAsset[item.id] ?? {};
      mergedVersions = mergeVersionDownloads(
        visibleVersions,
        countsForAsset,
        `${type}:${item.id}`,
      );

      const completeVersions =
        integrity?.listings?.[item.id]?.complete_versions;
      const filteredByIntegrity = Array.isArray(completeVersions)
        ? mergedVersions.filter((version) =>
            completeVersions.includes(version.version),
          )
        : mergedVersions;

      if (!cancelled) {
        setVersions(filteredByIntegrity);
      }
    }

    buildDisplayVersions();

    return () => {
      cancelled = true;
    };
  }, [fetchedVersions, id, item, type]);

  const latestVersion = versions[0];
  const totalDownloads = useMemo(() => {
    if (!versions.length) return undefined;
    return versions.reduce((sum, v) => sum + (v.downloads ?? 0), 0);
  }, [versions]);

  const gallery = useMemo(() => item?.gallery ?? [], [item?.gallery]);
  const hasGallery = gallery.length > 0;

  if (itemLoading) {
    return (
      <div
        className="railyard-accent px-6 py-8 max-w-screen-xl mx-auto space-y-5"
        style={{ minHeight: 'calc(100vh - var(--app-navbar-offset, 5.5rem))' }}
      >
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div
        className="railyard-accent px-6 py-8 max-w-screen-xl mx-auto space-y-5"
        style={{ minHeight: 'calc(100vh - var(--app-navbar-offset, 5.5rem))' }}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/railyard">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={browseHref}>Browse</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <EmptyState
          icon={CircleAlert}
          title="Project not found"
          description="The mod or map you're looking for doesn't exist in the registry."
        />
      </div>
    );
  }

  return (
    <div
      className="railyard-accent px-6 py-8 max-w-screen-xl mx-auto space-y-5"
      style={{ minHeight: 'calc(100vh - var(--app-navbar-offset, 5.5rem))' }}
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/railyard">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={browseHref}>Browse</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProjectHeader
        type={type}
        item={item}
        latestVersion={latestVersion}
        versionsLoading={versionsLoading}
        totalDownloads={totalDownloads}
      />

      <div className="space-y-5">
        <ProjectTabs
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'description', label: 'Description', icon: AlignLeft },
            ...(hasGallery
              ? [{ value: 'gallery', label: 'Gallery', icon: Images }]
              : []),
            { value: 'versions', label: 'Versions', icon: History },
          ]}
        />

        {activeTab === 'description' && (
          <MarkdownPanel markdown={item.description} />
        )}

        {hasGallery && activeTab === 'gallery' && (
          <ProjectGallery type={type} id={item.id} gallery={gallery} />
        )}

        {activeTab === 'versions' && (
          <ProjectVersions
            type={type}
            itemId={item.id}
            itemName={item.name}
            versions={versions}
            loading={versionsLoading}
            error={versionsError}
          />
        )}
      </div>
    </div>
  );
}
