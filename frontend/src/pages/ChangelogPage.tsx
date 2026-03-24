import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Calendar,
  CheckCircle,
  CircleAlert,
  Download,
  FileText,
  Gamepad2,
  Loader2,
  Tag,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { toast } from 'sonner';
import { Link, useRoute } from 'wouter';

import { AssetActionDialog } from '@/components/dialogs/AssetActionDialog';
import { InstallErrorDialog } from '@/components/dialogs/InstallErrorDialog';
import { PrereleaseConfirmDialog } from '@/components/dialogs/PrereleaseConfirmDialog';
import { SubscriptionSyncErrorDialog } from '@/components/dialogs/SubscriptionSyncErrorDialog';
import { UninstallDialog } from '@/components/dialogs/UninstallDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { listingPathToAssetType } from '@/lib/asset-types';
import { getLocalAccentClasses } from '@/lib/local-accent';
import { isCompatible } from '@/lib/semver';
import {
  hasCancellationSyncErrors,
  hasOnlySilentSyncWarnings,
  isCancellationSyncError,
  toSubscriptionSyncErrorState,
} from '@/lib/subscription-sync-error';
import {
  mergeVersionDownloads,
  withZeroDownloads,
} from '@/lib/version-downloads';
import { useDownloadQueueStore } from '@/stores/download-queue-store';
import {
  AssetConflictError,
  useInstalledStore,
} from '@/stores/installed-store';
import { useRegistryStore } from '@/stores/registry-store';

import type { types } from '../../wailsjs/go/models';
import {
  GetAssetDownloadCounts,
  GetVersionsResponse,
} from '../../wailsjs/go/registry/Registry';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

const INSTALL_ACCENT = getLocalAccentClasses('install');
const FILES_ACCENT = getLocalAccentClasses('files');

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

export function ChangelogPage() {
  const [, params] = useRoute('/project/:type/:id/changelog/:version');
  const mods = useRegistryStore((s) => s.mods);
  const maps = useRegistryStore((s) => s.maps);
  const modIntegrity = useRegistryStore((s) => s.modIntegrity);
  const mapIntegrity = useRegistryStore((s) => s.mapIntegrity);

  const routeType = params?.type;
  const type = routeType ? listingPathToAssetType(routeType) : undefined;
  const id = params?.id;
  const versionParam = params?.version
    ? decodeURIComponent(params.version)
    : undefined;

  const item =
    type === 'mod'
      ? mods.find((m) => m.id === id)
      : type === 'map'
        ? maps.find((m) => m.id === id)
        : undefined;

  const [versionInfo, setVersionInfo] = useState<types.VersionInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [uninstallOpen, setUninstallOpen] = useState(false);
  const [installError, setInstallError] = useState<{
    version: string;
    message: string;
  } | null>(null);
  const [prereleasePrompt, setPrereleasePrompt] = useState(false);
  const [subscriptionSyncError, setSubscriptionSyncError] = useState<{
    version: string;
    message: string;
    errors: types.UserProfilesError[];
  } | null>(null);
  const [conflictState, setConflictState] = useState<{
    version: string;
    conflict: types.MapCodeConflict;
  } | null>(null);

  const {
    installMod,
    installMap,
    cancelPendingInstall,
    getInstalledVersion,
    isInstalling,
    isUninstalling,
  } = useInstalledStore();

  const installedVersion = item ? getInstalledVersion(item.id) : undefined;
  const installing = item ? isInstalling(item.id) : false;
  const uninstalling = item ? isUninstalling(item.id) : false;
  const cancellationToastId = `cancel-install-${type}-${id}`;

  const projectHref =
    routeType && id ? `/project/${routeType}/${id}` : '/browse';

  useEffect(() => {
    if (!item || !type || !versionParam) return;
    const source =
      item.update.type === 'github' ? item.update.repo : item.update.url;
    if (!source) {
      setFetchError('No update source configured');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    GetVersionsResponse(item.update.type, source)
      .then(async (response) => {
        if (cancelled) return;
        if (response.status !== 'success') {
          setFetchError(response.message || 'Failed to load versions');
          setLoading(false);
          return;
        }
        const all = response.versions ?? [];
        const visibleVersions =
          type === 'mod' ? all.filter((v) => v.manifest) : all;

        let mergedVersions = withZeroDownloads(visibleVersions);
        try {
          const countsResult = await GetAssetDownloadCounts(type, item.id);
          if (countsResult.status === 'success') {
            mergedVersions = mergeVersionDownloads(
              visibleVersions,
              countsResult.counts ?? {},
              `${type}:${item.id}`,
            );
          }
        } catch {
        }

        if (!cancelled) {
          const integrity = type === 'mod' ? modIntegrity : mapIntegrity;
          const completeVersions =
            integrity && id ? integrity.listings[id]?.complete_versions : null;
          const filtered = completeVersions
            ? mergedVersions.filter((v) => completeVersions.includes(v.version))
            : mergedVersions;

          const found = filtered.find((v) => v.version === versionParam);
          setVersionInfo(found ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    type,
    item?.id,
    item?.update.type,
    item?.update.repo,
    item?.update.url,
    versionParam,
  ]);

  const doInstall = async (version: string, replaceOnConflict = false) => {
    if (!item || !type) return;
    try {
      let result: types.UpdateSubscriptionsResult;
      if (type === 'mod') {
        result = await installMod(item.id, version);
      } else {
        result = await installMap(item.id, version, replaceOnConflict);
      }
      if (result.status === 'warn') {
        if (hasCancellationSyncErrors(result.errors)) {
          toast.success(`Cancelled pending install for ${item.name}.`, {
            id: cancellationToastId,
          });
        } else if (!hasOnlySilentSyncWarnings(result.errors)) {
          toast.warning(
            result.message ||
              `Install for ${item.name} completed with warnings.`,
          );
        }
        return;
      }
      const { completed, total } = useDownloadQueueStore.getState();
      const queueText = total > 1 ? ` (${completed}/${total} Downloaded)` : '';
      toast.success(
        `${item.name} ${version} installed successfully.${queueText}`,
      );
    } catch (err) {
      if (err instanceof AssetConflictError && err.conflicts.length > 0) {
        setConflictState({ version, conflict: err.conflicts[0] });
        return;
      }
      const syncError = toSubscriptionSyncErrorState(err, version);
      if (syncError) {
        if (
          useInstalledStore.getState().isUninstalling(item.id) ||
          isCancellationSyncError(syncError)
        ) {
          toast.success(`Cancelled pending install for ${item.name}.`, {
            id: cancellationToastId,
          });
          return;
        }
        setSubscriptionSyncError(syncError);
      } else {
        setInstallError({
          version,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  };

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

  if (!item || !type) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="Project not found"
        description="The mod or map you're looking for doesn't exist in the registry."
      />
    );
  }

  const renderInstallButton = () => {
    if (!versionInfo) return null;
    const compat = isCompatible('', versionInfo.game_version);
    const incompatible = compat === false;

    if (uninstalling) {
      return (
        <Button size="sm" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
          Canceling...
        </Button>
      );
    }
    if (installing) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await cancelPendingInstall(type, item.id);
              toast.success(`Cancelled pending install for ${item.name}.`, {
                id: cancellationToastId,
              });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : String(err));
            }
          }}
        >
          <X className="h-4 w-4" />
          Cancel Install
        </Button>
      );
    }
    if (installedVersion === versionInfo.version) {
      return (
        <div className="flex items-center gap-3">
          <Badge variant="success" className="h-9 gap-1.5 rounded-lg px-3 text-sm">
            <CheckCircle className="h-3.5 w-3.5" />
            Installed
          </Badge>
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => setUninstallOpen(true)}
            aria-label="Uninstall"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    if (incompatible) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  disabled
                  className={INSTALL_ACCENT.solidButton}
                >
                  <Download className="h-4 w-4" />
                  Install {versionInfo.version}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Incompatible with your game version</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <Button
        size="sm"
        className={INSTALL_ACCENT.solidButton}
        onClick={() => {
          if (versionInfo.prerelease) {
            setPrereleasePrompt(true);
          } else {
            doInstall(versionInfo.version);
          }
        }}
      >
        <Download className="h-4 w-4" />
        Install {versionInfo.version}
      </Button>
    );
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={projectHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/browse"
              className="hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            <span>/</span>
            <Link
              href={projectHref}
              className="hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">{versionParam}</span>
          </nav>
        </div>

        {loading ? (
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
            description={`Version ${versionParam} was not found for ${item.name}.`}
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
                        : `${item.name} ${versionInfo.version}`}
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

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
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
                              onClick={(e) => {
                                if (href) {
                                  e.preventDefault();
                                  BrowserOpenURL(href);
                                }
                              }}
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

              <div className="rounded-xl border border-border bg-card h-fit">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold">Information</h2>
                </div>
                <div className="px-4 divide-y divide-border/50">
                  <MetaRow icon={Tag} label="Version">
                    {versionInfo.version}
                  </MetaRow>

                  <MetaRow icon={CheckCircle} label="Release Type">
                    {versionInfo.prerelease ? (
                      <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-400">
                        Beta
                      </Badge>
                    ) : (
                      <Badge variant="success">Release</Badge>
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
          </>
        )}
      </div>

      {item && (
        <>
          <UninstallDialog
            open={uninstallOpen}
            onOpenChange={setUninstallOpen}
            type={type}
            id={item.id}
            name={item.name}
          />

          {prereleasePrompt && versionInfo && (
            <PrereleaseConfirmDialog
              open={prereleasePrompt}
              onOpenChange={(open) => {
                if (!open) setPrereleasePrompt(false);
              }}
              itemName={item.name}
              version={versionInfo.version}
              onConfirm={() => doInstall(versionInfo.version)}
            />
          )}

          {installError && (
            <InstallErrorDialog
              open={!!installError}
              onOpenChange={(open) => {
                if (!open) setInstallError(null);
              }}
              itemName={item.name}
              version={installError.version}
              error={installError.message}
            />
          )}

          {subscriptionSyncError && (
            <SubscriptionSyncErrorDialog
              open={!!subscriptionSyncError}
              onOpenChange={(open) => {
                if (!open) setSubscriptionSyncError(null);
              }}
              itemName={item.name}
              version={subscriptionSyncError.version}
              message={subscriptionSyncError.message}
              errors={subscriptionSyncError.errors}
            />
          )}

          {conflictState && (
            <AssetActionDialog
              open={!!conflictState}
              onOpenChange={(open) => {
                if (!open) setConflictState(null);
              }}
              loading={false}
              icon={AlertTriangle}
              iconClassName="h-5 w-5 text-[var(--files-primary)]"
              title={`Replace conflicting map for ${item.name}?`}
              description={`Installing ${item.name} ${conflictState.version} conflicts with an existing map. Replace the existing map to continue.`}
              conflict={conflictState.conflict}
              confirmLabel="Replace"
              confirmClassName={FILES_ACCENT.solidButton}
              tone="files"
              onConfirm={() => {
                const version = conflictState.version;
                setConflictState(null);
                void doInstall(version, true);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
