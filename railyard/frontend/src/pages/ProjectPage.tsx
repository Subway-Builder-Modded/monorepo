import {
  EmptyState,
  MarkdownPanel,
  ProjectDetailShell,
  ProjectTabs,
} from '@subway-builder-modded/asset-listings-ui';
import {
  mergeVersionDownloads,
  withZeroDownloads,
} from '@subway-builder-modded/asset-listings-ui';
import { listingPathToAssetType } from '@subway-builder-modded/config';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@subway-builder-modded/shared-ui';
import { AlignLeft, CircleAlert, History, Images } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';

import { ProjectGallery } from '@/components/project/ProjectGallery';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectVersions } from '@/components/project/ProjectVersions';
import { isCompatible } from '@/lib/semver';
import { useRegistryStore } from '@/stores/registry-store';
import { useUIStore } from '@/stores/ui-store';

import { GetGameVersion } from '../../wailsjs/go/main/App';
import type { types } from '../../wailsjs/go/models';
import {
  GetAssetDownloadCounts,
  GetVersionsResponse,
} from '../../wailsjs/go/registry/Registry';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export function ProjectPage() {
  const [, params] = useRoute('/project/:type/:id');
  const mods = useRegistryStore((s) => s.mods);
  const maps = useRegistryStore((s) => s.maps);
  const mapIntegrity = useRegistryStore((s) => s.mapIntegrity);
  const modIntegrity = useRegistryStore((s) => s.modIntegrity);
  const modDownloadTotals = useRegistryStore((s) => s.modDownloadTotals);
  const mapDownloadTotals = useRegistryStore((s) => s.mapDownloadTotals);
  const ensureDownloadTotals = useRegistryStore((s) => s.ensureDownloadTotals);

  const routeType = params?.type;
  const type = routeType ? listingPathToAssetType(routeType) : undefined;
  const id = params?.id;
  const projectKey = type && id ? `${type}:${id}` : '';
  const activeTab = useUIStore((s) =>
    projectKey ? (s.projectTabs[projectKey] ?? 'description') : 'description',
  );
  const setProjectTab = useUIStore((s) => s.setProjectTab);

  const item =
    type === 'mod'
      ? mods.find((m) => m.id === id)
      : type === 'map'
        ? maps.find((m) => m.id === id)
        : undefined;

  const [versions, setVersions] = useState<types.VersionInfo[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [gameVersion, setGameVersion] = useState<string>('');

  const filterInvalidVersions = (vs: types.VersionInfo[]) => {
    if (type === 'mod' && modIntegrity && id) {
      return vs.filter((v) =>
        modIntegrity.listings[id].complete_versions.includes(v.version),
      );
    }
    if (type === 'map' && mapIntegrity && id) {
      return vs.filter((v) =>
        mapIntegrity.listings[id].complete_versions.includes(v.version),
      );
    }
  };

  useEffect(() => {
    ensureDownloadTotals();
  }, [ensureDownloadTotals]);

  useEffect(() => {
    GetGameVersion()
      .then((response) => {
        if (response.status === 'success') {
          setGameVersion(response.version || '');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!item || !type) return;
    const source =
      item.update.type === 'github' ? item.update.repo : item.update.url;
    if (!source) {
      setVersionsLoading(false);
      setVersionsError('No update source configured');
      return;
    }
    let cancelled = false;
    setVersionsLoading(true);
    setVersionsError(null);
    GetVersionsResponse(item.update.type, source)
      .then(async (response) => {
        if (cancelled) return;
        if (response.status !== 'success') {
          setVersionsError(response.message || 'Failed to load versions');
          setVersionsLoading(false);
          return;
        }
        const all = response.versions || [];
        const visibleVersions =
          type === 'mod' ? all.filter((ver) => ver.manifest) : all;

        let mergedVersions = withZeroDownloads(visibleVersions);
        try {
          const countsResult = await GetAssetDownloadCounts(type, item.id);
          if (countsResult.status === 'success') {
            mergedVersions = mergeVersionDownloads(
              visibleVersions,
              countsResult.counts ?? {},
              `${type}:${item.id}`,
            );
          } else {
            console.warn(
              `[${type}:${item.id}] Failed to fetch download counts: ${countsResult.message}`,
            );
          }
        } catch (countErr) {
          const message =
            countErr instanceof Error ? countErr.message : String(countErr);
          console.warn(
            `[${type}:${item.id}] Failed to fetch download counts: ${message}`,
          );
        }

        if (!cancelled) {
          setVersions(filterInvalidVersions(mergedVersions) || mergedVersions);
          setVersionsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setVersionsError(err instanceof Error ? err.message : String(err));
          setVersionsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [type, item?.id, item?.update.type, item?.update.repo, item?.update.url]);

  const latestVersion = versions[0];
  const latestCompatibleVersion = useMemo(() => {
    if (!gameVersion) return latestVersion;
    return (
      versions.find(
        (v) => isCompatible(gameVersion, v.game_version) !== false,
      ) ?? latestVersion
    );
  }, [versions, gameVersion, latestVersion]);

  const totalDownloads = id
    ? type === 'mod'
      ? (modDownloadTotals[id] ?? undefined)
      : (mapDownloadTotals[id] ?? undefined)
    : undefined;

  const gallery = useMemo(() => item?.gallery || [], [item?.gallery]);
  const hasGallery = gallery.length > 0;

  if (!item || !type) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="Project not found"
        description="The mod or map you're looking for doesn't exist in the registry."
      />
    );
  }

  return (
    <ProjectDetailShell
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/browse">Browse</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      header={
        <ProjectHeader
          type={type}
          item={item}
          latestVersion={latestVersion}
          latestCompatibleVersion={latestCompatibleVersion}
          versionsLoading={versionsLoading}
          gameVersion={gameVersion}
          totalDownloads={totalDownloads}
        />
      }
      tabs={
        <ProjectTabs
          value={activeTab}
          onChange={(tab) => setProjectTab(projectKey, tab)}
          options={[
            { value: 'description', label: 'Description', icon: AlignLeft },
            ...(hasGallery
              ? [{ value: 'gallery', label: 'Gallery', icon: Images }]
              : []),
            { value: 'versions', label: 'Versions', icon: History },
          ]}
        />
      }
      body={
        <>
          {activeTab === 'description' && (
            <MarkdownPanel
              markdown={item.description}
              onLinkClick={(href) => {
                BrowserOpenURL(href);
              }}
            />
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
              gameVersion={gameVersion}
            />
          )}
        </>
      }
    />
  );
}
