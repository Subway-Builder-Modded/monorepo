'use client';

import {
  ArrowDownToLine,
  ArrowLeft,
  Calendar,
  CircleAlert,
  Download,
  FileText,
  Gamepad2,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import { EmptyState } from '@/features/railyard/components/empty-state';
import { ErrorBanner } from '@/features/railyard/components/error-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRegistryItem } from '@/hooks/use-registry-item';
import { useVersions } from '@/hooks/use-versions';
import { fetchRegistryJsonWithFallback } from '@/lib/railyard/registry-source';
import {
  mergeVersionDownloads,
  withZeroDownloads,
} from '@/lib/railyard/version-downloads';
import type {
  AssetDownloadCountsByVersion,
  RegistryIntegrityReport,
} from '@/types/registry';
import type { VersionInfo } from '@/types/registry';

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

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold leading-none mb-1">
          {label}
        </p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

interface ChangelogPageProps {
  type: 'mods' | 'maps';
  id: string;
  version: string;
}

export function ChangelogPage({
  type,
  id,
  version: versionParam,
}: ChangelogPageProps) {
  const {
    item,
    loading: itemLoading,
    error: itemError,
  } = useRegistryItem(type, id);
  const { versions: fetchedVersions, loading: versionsLoading } = useVersions(
    item?.update,
  );

  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const projectHref = `/railyard/${type}/${id}`;

  useEffect(() => {
    if (itemLoading || versionsLoading) return;
    if (!item || !fetchedVersions.length) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function buildVersion() {
      try {
        setLoading(true);
        setFetchError(null);

        const visibleVersions =
          type === 'mods'
            ? fetchedVersions.filter((v) => Boolean(v.manifest))
            : fetchedVersions;

        const [integrity, countsByAsset] = await Promise.all([
          fetchIntegrity(type),
          fetchDownloadCounts(type),
        ]);

        let mergedVersions = withZeroDownloads(visibleVersions);
        const countsForAsset = countsByAsset[id] ?? {};
        mergedVersions = mergeVersionDownloads(
          visibleVersions,
          countsForAsset,
          `${type}:${id}`,
        );

        const completeVersions = integrity?.listings?.[id]?.complete_versions;
        const filtered = Array.isArray(completeVersions)
          ? mergedVersions.filter((v) => completeVersions.includes(v.version))
          : mergedVersions;

        const found = filtered.find((v) => v.version === versionParam);

        if (!cancelled) {
          setVersionInfo(found ?? null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : 'Failed to load version',
          );
          setLoading(false);
        }
      }
    }

    buildVersion();
    return () => {
      cancelled = true;
    };
  }, [
    type,
    id,
    versionParam,
    item,
    fetchedVersions,
    itemLoading,
    versionsLoading,
  ]);

  const formattedDate = useMemo(() => {
    if (!versionInfo?.date) return null;
    try {
      return new Date(versionInfo.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return versionInfo.date;
    }
  }, [versionInfo?.date]);

  const handleOpenInRailyard = () => {
    window.location.href = `railyard://open?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}&version=${encodeURIComponent(versionParam)}`;
  };

  if (itemError || (!itemLoading && !item)) {
    return (
      <div
        className="railyard-accent px-6 py-8 max-w-screen-xl mx-auto"
        style={{ minHeight: 'calc(100vh - var(--app-navbar-offset, 5.5rem))' }}
      >
        <EmptyState
          icon={CircleAlert}
          title="Project not found"
          description="The mod or map you're looking for doesn't exist in the registry."
        />
      </div>
    );
  }

  const isShowingLoader = itemLoading || loading;

  const renderInstallButton = () => {
    if (!versionInfo) return null;

    return (
      <Button
        size="sm"
        className="!bg-[var(--suite-accent-light)] !text-[var(--suite-text-inverted-light)] border-transparent hover:!brightness-90 dark:!bg-[var(--suite-accent-dark)] dark:!text-[var(--suite-text-inverted-dark)]"
        onPress={handleOpenInRailyard}
      >
        <Download className="h-4 w-4" />
        Open in Railyard
      </Button>
    );
  };

  return (
    <div
      className="railyard-accent px-6 py-8 max-w-screen-xl mx-auto space-y-5"
      style={{ minHeight: 'calc(100vh - var(--app-navbar-offset, 5.5rem))' }}
    >
      <div className="flex items-center gap-3">
        <Link
          href={projectHref}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent/45 hover:text-primary transition-colors"
          aria-label="Back to project"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href="/railyard"
            className="hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href="/railyard/browse"
            className="hover:text-foreground transition-colors"
          >
            Browse
          </Link>
          <span>/</span>
          <Link
            href={projectHref}
            className="hover:text-foreground transition-colors"
          >
            {item?.name ?? id}
          </Link>
          <span>/</span>
          <span className="text-foreground">{versionParam}</span>
        </nav>
      </div>

      {isShowingLoader ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      ) : fetchError ? (
        <ErrorBanner message={fetchError} />
      ) : !versionInfo ? (
        <EmptyState
          icon={FileText}
          title="Version not found"
          description={`Version ${versionParam} was not found for ${item?.name ?? id}.`}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {versionInfo.name &&
                    versionInfo.name !== versionInfo.version
                      ? versionInfo.name
                      : `${item?.name ?? id} ${versionInfo.version}`}
                  </h1>
                  {versionInfo.prerelease && (
                    <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-400">
                      Beta
                    </Badge>
                  )}
                </div>
                {formattedDate && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formattedDate}
                  </p>
                )}
              </div>
              <div className="shrink-0">{renderInstallButton()}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
              <div>
                <div className="rounded-xl border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-sm font-semibold">Changelog</h2>
                  </div>
                  <div className="p-4">
                    {versionInfo.changelog ? (
                      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed">
                        <Markdown
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            a: ({ href, children, ...props }) => (
                              <a
                                {...props}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {versionInfo.changelog}
                        </Markdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No changelog provided for this version.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card h-fit">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold">Information</h2>
                </div>
                <div className="px-4 divide-y divide-border/50">
                  <MetaRow icon={Tag} label="Version">
                    {versionInfo.version}
                  </MetaRow>

                  <MetaRow icon={Gamepad2} label="Release Type">
                    {versionInfo.prerelease ? (
                      <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-400">
                        Beta
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400 dark:bg-green-400/10 dark:border-green-400/30">
                        Release
                      </Badge>
                    )}
                  </MetaRow>

                  {versionInfo.game_version && (
                    <MetaRow icon={Gamepad2} label="Game Version">
                      {versionInfo.game_version}
                    </MetaRow>
                  )}

                  <MetaRow icon={ArrowDownToLine} label="Downloads">
                    {versionInfo.downloads.toLocaleString()}
                  </MetaRow>

                  {formattedDate && (
                    <MetaRow icon={Calendar} label="Published">
                      {formattedDate}
                    </MetaRow>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
