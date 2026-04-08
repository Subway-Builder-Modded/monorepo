import {
  AlertTriangle,
  ChartLine,
  Check,
  CircleFadingArrowUp,
  CircleX,
  Copy,
  Download,
  ExternalLink,
  Globe,
  OctagonX,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppDialog } from '@/components/dialogs/AppDialog';
import { AuthorName } from '@/components/shared/AuthorName';
import { GalleryImage } from '@/components/shared/GalleryImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type AssetType, assetTypeToListingPath } from '@/lib/asset-types';
import { getCountryFlagIcon } from '@/lib/flags';
import { getLocalAccentClasses } from '@/lib/local-accent';
import { formatSourceQuality } from '@/lib/map-filter-values';
import {
  handleSubscriptionMutationError,
  useSubscriptionMutationLockState,
  withLockAwareConfirm,
} from '@/lib/subscription-mutation-ui';
import {
  hasCancellationSyncErrors,
  hasOnlySilentSyncWarnings,
  isCancellationSyncError,
  toSubscriptionSyncErrorState,
} from '@/lib/subscription-sync-error';
import { requestLatestSubscriptionUpdatesForActiveProfile } from '@/lib/subscription-updates';
import { cn } from '@/lib/utils';
import { useDownloadQueueStore } from '@/stores/download-queue-store';
import {
  AssetConflictError,
  useInstalledStore,
} from '@/stores/installed-store';

import type { types } from '../../../wailsjs/go/models';
import { BrowserOpenURL } from '../../../wailsjs/runtime/runtime';

interface ProjectHeaderProps {
  type: AssetType;
  item: types.ModManifest | types.MapManifest;
  latestVersion?: types.VersionInfo;
  latestCompatibleVersion?: types.VersionInfo;
  versionsLoading: boolean;
  gameVersion: string;
  totalDownloads?: number;
}

const FILES_ACCENT = getLocalAccentClasses('files');
const INSTALL_ACCENT = getLocalAccentClasses('install');
const UPDATE_ACCENT = getLocalAccentClasses('update');
const UNINSTALL_ACCENT = getLocalAccentClasses('uninstall');
const ANALYTICS_ACCENT = getLocalAccentClasses('profiles');

const ACTION_ICON_BASE =
  'disabled:!text-muted-foreground disabled:opacity-100 disabled:saturate-100';

function conflictSourceLabel(conflict: types.MapCodeConflict): string {
  if (conflict.existingAssetId?.startsWith('vanilla:')) return 'Vanilla';
  return conflict.existingIsLocal ? 'Local' : 'Registry';
}

function isMapManifest(
  item: types.ModManifest | types.MapManifest,
): item is types.MapManifest {
  return 'city_code' in item;
}

export function ProjectHeader({
  type,
  item,
  latestVersion,
  latestCompatibleVersion,
  versionsLoading,
  gameVersion,
  totalDownloads,
}: ProjectHeaderProps) {
  const mapItem = isMapManifest(item) ? item : null;
  const cancellationToastId = `cancel-install-${type}-${item.id}`;
  const { locked: mutationLocked, reason: mutationLockedReason } =
    useSubscriptionMutationLockState();

  const [uninstallOpen, setUninstallOpen] = useState(false);
  const [uninstallLoading, setUninstallLoading] = useState(false);
  const [installError, setInstallError] = useState<{
    version: string;
    message: string;
  } | null>(null);
  const [errorCopied, setErrorCopied] = useState(false);
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
    getInstalledVersion,
    isInstalling,
    isUninstalling,
    uninstallAssets,
    updateAssetsToLatest,
    cancelPendingInstall,
  } = useInstalledStore();

  const installedVersion = getInstalledVersion(item.id);
  const installing = isInstalling(item.id);
  const uninstalling = isUninstalling(item.id);
  const effectiveVersion = latestCompatibleVersion ?? latestVersion;
  const [pendingLatestVersion, setPendingLatestVersion] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!installedVersion) {
      setPendingLatestVersion(null);
      return;
    }

    let cancelled = false;
    requestLatestSubscriptionUpdatesForActiveProfile({
      apply: false,
      targets: [{ id: item.id, type }],
    })
      .then((result) => {
        if (cancelled || result.status === 'error') {
          return;
        }

        const pending = result.pendingUpdates?.find(
          (update) => update.assetId === item.id && update.type === type,
        );
        setPendingLatestVersion(pending?.latestVersion ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setPendingLatestVersion(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [installedVersion, item.id, type, installing, uninstalling]);

  const updateTargetVersion = pendingLatestVersion ?? effectiveVersion?.version;
  const hasUpdate =
    installedVersion &&
    updateTargetVersion &&
    installedVersion !== updateTargetVersion;
  const authorAlias = item.author.author_alias;
  const authorAttributionLink = item.author.attribution_link;
  const noCompatibleVersion =
    gameVersion && latestVersion && !latestCompatibleVersion;

  const doInstall = async (version: string, replaceOnConflict = false) => {
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
      if (handleSubscriptionMutationError(err, () => {})) {
        return;
      }
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

  const handleInstallClick = (version: string, prerelease?: boolean) => {
    if (prerelease) {
      setPrereleasePrompt(true);
    } else {
      doInstall(version);
    }
  };

  const handleUninstall = async () => {
    setUninstallLoading(true);
    try {
      await uninstallAssets([{ id: item.id, type }]);
      toast.success(`${item.name} has been uninstalled.`);
      setUninstallOpen(false);
    } catch (err) {
      if (!handleSubscriptionMutationError(err, () => {})) {
        toast.error(`Failed to uninstall ${item.name}.`);
      }
    } finally {
      setUninstallLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!installedVersion || !hasUpdate) return;

    try {
      await updateAssetsToLatest([{ id: item.id, type }]);
      toast.success(`${item.name} has been updated.`);
      setPendingLatestVersion(null);
    } catch (err) {
      handleSubscriptionMutationError(err, `Failed to update ${item.name}.`);
    }
  };

  const handleCopyError = async () => {
    if (!installError) return;
    await navigator.clipboard.writeText(installError.message);
    setErrorCopied(true);
    setTimeout(() => setErrorCopied(false), 2000);
  };

  const renderActionButtons = () => {
    const analyticsUrl = `https://subwaybuildermodded.com/registry/${assetTypeToListingPath(type)}/${item.id}`;

    // Combined install / update / cancel button
    const isInstalled = !!installedVersion;
    const installUpdateAccent = isInstalled ? UPDATE_ACCENT : INSTALL_ACCENT;

    const installUpdateDisabled = installing
      ? false // cancel is always enabled
      : isInstalled
        ? !hasUpdate || mutationLocked || uninstalling || versionsLoading
        : !effectiveVersion ||
          !!noCompatibleVersion ||
          mutationLocked ||
          uninstalling ||
          versionsLoading;

    let installUpdateTooltip: string;
    switch (true) {
      case installing:
        installUpdateTooltip = 'Cancel';
        break;
      case isInstalled:
        installUpdateTooltip =
          hasUpdate && updateTargetVersion
            ? `Update to ${updateTargetVersion}`
            : 'Up to date';
        break;
      case versionsLoading:
        installUpdateTooltip = 'Loading...';
        break;
      case uninstalling:
        installUpdateTooltip = 'Uninstalling...';
        break;
      case !!noCompatibleVersion:
        installUpdateTooltip = `No compatible version (game ${gameVersion})`;
        break;
      case !!effectiveVersion:
        installUpdateTooltip = `Install ${effectiveVersion!.version}`;
        break;
      default:
        installUpdateTooltip = 'No version available';
    }

    const handleInstallUpdateClick = async () => {
      if (installing) {
        try {
          const result = await cancelPendingInstall(type, item.id);
          if (
            result.status === 'warn' &&
            !hasOnlySilentSyncWarnings(result.errors)
          ) {
            toast.warning(
              result.message ||
                `Cancel for ${item.name} completed with warnings.`,
            );
          } else {
            toast.success(`Cancelled pending install for ${item.name}.`, {
              id: cancellationToastId,
            });
          }
        } catch (err) {
          if (!handleSubscriptionMutationError(err, () => {})) {
            toast.error(
              err instanceof Error
                ? err.message
                : `Failed to cancel pending install for ${item.name}.`,
            );
          }
        }
        return;
      }
      if (isInstalled) {
        void handleUpdate();
      } else if (effectiveVersion) {
        handleInstallClick(
          effectiveVersion.version,
          effectiveVersion.prerelease,
        );
      }
    };

    const uninstallDisabled =
      installing || uninstalling || !isInstalled || mutationLocked;
    const uninstallTooltip = isInstalled
      ? `Uninstall ${installedVersion}`
      : 'Not installed';

    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  installing
                    ? cn(
                        UNINSTALL_ACCENT.iconButton,
                        '!bg-[color-mix(in_srgb,var(--local-tone-primary)_20%,transparent)]',
                      )
                    : cn(installUpdateAccent.iconButton, ACTION_ICON_BASE),
                )}
                disabled={installUpdateDisabled}
                onClick={() => {
                  void handleInstallUpdateClick();
                }}
              >
                {installing ? (
                  <X />
                ) : isInstalled ? (
                  <CircleFadingArrowUp />
                ) : (
                  <Download />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{installUpdateTooltip}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(UNINSTALL_ACCENT.iconButton, ACTION_ICON_BASE)}
                disabled={uninstallDisabled}
                onClick={() => setUninstallOpen(true)}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{uninstallTooltip}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(ANALYTICS_ACCENT.iconButton, ACTION_ICON_BASE)}
                onClick={() => BrowserOpenURL(analyticsUrl)}
              >
                <ChartLine />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Analytics</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  const badges = mapItem
    ? [
        mapItem.location,
        formatSourceQuality(mapItem.source_quality),
        mapItem.level_of_detail,
        ...(mapItem.special_demand ?? []),
      ].filter((v): v is string => Boolean(v))
    : (item.tags ?? []);

  const CountryFlag = mapItem?.country
    ? getCountryFlagIcon(mapItem.country.trim().toUpperCase())
    : null;

  return (
    <>
      <div className="flex gap-7">
        <div className="relative h-[10rem] w-[10rem] shrink-0 overflow-hidden rounded-xl bg-muted border border-border/50">
          <GalleryImage
            type={type}
            id={item.id}
            imagePath={item.gallery?.[0]}
            className="absolute inset-0 h-full w-full object-cover"
            fallbackIconClassName="h-10 w-10"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-start justify-between gap-4 pt-1">
          <div className="flex min-w-0 flex-col gap-2.5">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-foreground">
                {item.name}
              </h1>
              {mapItem?.city_code && (
                <div className="mt-1 flex items-center gap-2.5 text-sm">
                  <span className="font-bold text-foreground">
                    {mapItem.city_code}
                  </span>
                  {mapItem.country && (
                    <>
                      <div className="h-4 w-0.5 shrink-0 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        {CountryFlag && (
                          <CountryFlag className="h-3.5 w-5 rounded-[1px]" />
                        )}
                        <span>{mapItem.country.trim().toUpperCase()}</span>
                      </span>
                    </>
                  )}
                </div>
              )}
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <span className="shrink-0">by</span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => BrowserOpenURL(authorAttributionLink)}
                >
                  <AuthorName
                    name={authorAlias}
                    contributorTier={item.author.contributor_tier}
                  />
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {typeof totalDownloads === 'number' && (
                <span className="flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  {totalDownloads.toLocaleString()}
                </span>
              )}
              {mapItem && (mapItem.population ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {mapItem.population.toLocaleString()}
                </span>
              )}
              {item.source && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground gap-1 no-underline hover:no-underline"
                  onClick={() => BrowserOpenURL(item.source!)}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Source
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 -ml-1.5">
                {badges.map((badge) => (
                  <Badge key={badge} variant="secondary" size="sm">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 pt-6">{renderActionButtons()}</div>
        </div>
      </div>

      <AppDialog
        open={uninstallOpen}
        onOpenChange={setUninstallOpen}
        title="Uninstall"
        description="This will permanently remove all installed files. You can reinstall it later from the Browse page."
        icon={OctagonX}
        tone="uninstall"
        confirm={withLockAwareConfirm(
          {
            label: 'Uninstall',
            onConfirm: handleUninstall,
            loading: uninstallLoading,
          },
          mutationLocked,
          mutationLockedReason,
        )}
      >
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{item.name}</span>
        </div>
      </AppDialog>

      {prereleasePrompt && effectiveVersion && (
        <AppDialog
          open={prereleasePrompt}
          onOpenChange={(open) => {
            if (!open) setPrereleasePrompt(false);
          }}
          title="Install Beta Release"
          icon={AlertTriangle}
          description={
            <>
              <span className="font-semibold text-foreground">{item.name}</span>{' '}
              {effectiveVersion.version} is a pre-release version and may be
              unstable or contain bugs.
            </>
          }
          tone="files"
          confirm={withLockAwareConfirm(
            {
              label: 'Install Anyway',
              onConfirm: () => {
                setPrereleasePrompt(false);
                doInstall(effectiveVersion.version);
              },
            },
            mutationLocked,
            mutationLockedReason,
          )}
        />
      )}

      {installError && (
        <AppDialog
          open={!!installError}
          onOpenChange={(open) => {
            if (!open) setInstallError(null);
          }}
          title="Installation Failed"
          icon={CircleX}
          description={
            <>
              Failed to install{' '}
              <span className="font-semibold text-foreground">{item.name}</span>{' '}
              {installError.version}
            </>
          }
          tone="uninstall"
        >
          <div className="space-y-0">
            <div className="flex items-center justify-between rounded-t-md border border-b-0 border-border bg-muted px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Error Details
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleCopyError}
              >
                {errorCopied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {errorCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap break-all rounded-b-md border border-t-0 border-border bg-muted/50 p-4 font-mono text-xs">
              {installError.message}
            </pre>
          </div>
        </AppDialog>
      )}

      {subscriptionSyncError && (
        <AppDialog
          open={!!subscriptionSyncError}
          onOpenChange={(open) => {
            if (!open) setSubscriptionSyncError(null);
          }}
          title="Subscription Sync Failed"
          icon={TriangleAlert}
          description={
            <>
              Could not finish updating subscriptions for{' '}
              <span className="font-semibold text-foreground">{item.name}</span>{' '}
              {subscriptionSyncError.version}.
            </>
          }
          tone="files"
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              {subscriptionSyncError.message}
            </p>
            {subscriptionSyncError.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Details
                </p>
                <div className="divide-y overflow-hidden rounded-lg border text-sm">
                  {subscriptionSyncError.errors.map((error, index) => (
                    <div
                      key={`${error.assetType}:${error.assetId}:${index}`}
                      className="space-y-0.5 px-3 py-2.5"
                    >
                      <p className="font-mono text-xs text-muted-foreground">
                        {error.assetType}:{error.assetId}
                      </p>
                      <p className="text-foreground">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AppDialog>
      )}

      {conflictState && (
        <AppDialog
          open={!!conflictState}
          onOpenChange={(open) => {
            if (!open) setConflictState(null);
          }}
          title={`Replace conflicting map for ${item.name}?`}
          description={`Installing ${item.name} ${conflictState.version} conflicts with an existing map. Replace the existing map to continue.`}
          icon={AlertTriangle}
          tone="files"
          confirm={withLockAwareConfirm(
            {
              label: 'Replace',
              onConfirm: () => {
                const version = conflictState.version;
                setConflictState(null);
                void doInstall(version, true);
              },
            },
            mutationLocked,
            mutationLockedReason,
          )}
        >
          <div
            className={`rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground ${FILES_ACCENT.dialogPanel}`}
          >
            <p className="font-medium text-foreground">
              Conflicting City Code: {conflictState.conflict.cityCode}
            </p>
            <p className="mt-1">
              Existing Asset: {conflictState.conflict.existingAssetId} (
              {conflictSourceLabel(conflictState.conflict)})
            </p>
            {conflictState.conflict.existingVersion ? (
              <p className="mt-1">
                Existing Version: {conflictState.conflict.existingVersion}
              </p>
            ) : null}
          </div>
        </AppDialog>
      )}
    </>
  );
}
