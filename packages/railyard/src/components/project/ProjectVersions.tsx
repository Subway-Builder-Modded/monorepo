import {
  AlertTriangle,
  Check,
  CheckCircle,
  CircleX,
  Copy,
  Download,
  Loader2,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'wouter';

import { AppDialog } from '../../components/dialogs/AppDialog';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import type { AssetType } from '../../lib/asset-types';
import { assetTypeToListingPath } from '../../lib/asset-types';
import { getLocalAccentClasses } from '../../lib/local-accent';
import { isCompatible } from '../../lib/semver';
import {
  handleSubscriptionMutationError,
  useSubscriptionMutationLockState,
  withLockAwareConfirm,
} from '../../lib/subscription-mutation-ui';
import {
  hasCancellationSyncErrors,
  hasOnlySilentSyncWarnings,
  isCancellationSyncError,
  toSubscriptionSyncErrorState,
} from '../../lib/subscription-sync-error';
import { cn } from '../../lib/utils';
import { useDownloadQueueStore } from '@railyard-app/stores/download-queue-store';
import {
  AssetConflictError,
  useInstalledStore,
} from '@railyard-app/stores/installed-store';
import { ProjectVersions as SharedProjectVersions } from '@sbm/shared/project/project-versions';
import type { SharedVersionInfo } from '@sbm/shared/railyard-core/shared-item';

import type { types } from '@railyard-app/wailsjs/go/models';


function conflictSourceLabel(conflict: types.MapCodeConflict): string {
  if (conflict.existingAssetId?.startsWith('vanilla:')) return 'Vanilla';
  return conflict.existingIsLocal ? 'Local' : 'Registry';
}

interface ProjectVersionsProps {
  type: AssetType;
  itemId: string;
  itemName: string;
  versions: types.VersionInfo[];
  loading: boolean;
  error: string | null;
  gameVersion: string;
}

const INSTALL_ACCENT = getLocalAccentClasses('install');
const FILES_ACCENT = getLocalAccentClasses('files');

export function ProjectVersions({
  type,
  itemId,
  itemName,
  versions,
  loading,
  error,
  gameVersion,
}: ProjectVersionsProps) {
  const [installError, setInstallError] = useState<{
    version: string;
    message: string;
  } | null>(null);
  const [errorCopied, setErrorCopied] = useState(false);
  const [prereleasePrompt, setPrereleasePrompt] = useState<{
    version: string;
  } | null>(null);
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
    getInstalledVersion,
    installMod,
    installMap,
    isInstalling,
    getInstallingVersion,
    isUninstalling,
  } = useInstalledStore();

  const cancellationToastId = `cancel-install-${type}-${itemId}`;
  const installedVersion = getInstalledVersion(itemId);
  const { locked: mutationLocked, reason: mutationLockedReason } =
    useSubscriptionMutationLockState();

  const doInstall = async (version: string, replaceOnConflict = false) => {
    try {
      let result: types.UpdateSubscriptionsResult;
      if (type === 'mod') {
        result = await installMod(itemId, version);
      } else {
        result = await installMap(itemId, version, replaceOnConflict);
      }
      if (result.status === 'warn') {
        if (hasCancellationSyncErrors(result.errors)) {
          toast.success(`Cancelled pending install for ${itemName}.`, {
            id: cancellationToastId,
          });
        } else if (!hasOnlySilentSyncWarnings(result.errors)) {
          toast.warning(
            result.message ||
              `Install for ${itemName} completed with warnings.`,
          );
        }
        return;
      }
      const { completed, total } = useDownloadQueueStore.getState();
      const queueText = total > 1 ? ` (${completed}/${total} Downloaded)` : '';
      toast.success(`Installed ${version} successfully.${queueText}`);
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
          useInstalledStore.getState().isUninstalling(itemId) ||
          isCancellationSyncError(syncError)
        ) {
          toast.success(`Cancelled pending install for ${itemName}.`, {
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

  const handleInstall = (version: string, prerelease: boolean) => {
    if (prerelease) {
      setPrereleasePrompt({ version });
    } else {
      doInstall(version);
    }
  };

  const handleCopyError = async () => {
    if (!installError) return;
    await navigator.clipboard.writeText(installError.message);
    setErrorCopied(true);
    setTimeout(() => setErrorCopied(false), 2000);
  };

  const typeListingPath = assetTypeToListingPath(type);

  return (
    <>
      <SharedProjectVersions
        itemName={itemName}
        versions={versions as SharedVersionInfo[]}
        loading={loading}
        error={error}
        renderVersionLink={({ version: v, children, className }) => (
          <Link
            href={`/project/${typeListingPath}/${itemId}/changelog/${encodeURIComponent(v.version)}`}
            className={className}
          >
            {children}
          </Link>
        )}
        renderVersionAction={(v) => {
          const isThisInstalled = installedVersion === v.version;
          const installing = isInstalling(itemId);
          const installingVersion = getInstallingVersion(itemId);
          const uninstalling = isUninstalling(itemId);
          const compat = isCompatible(gameVersion, v.game_version);
          const incompatible = compat === false;

          return (
            <span className={cn(incompatible && 'opacity-50')}>
              {uninstalling ? (
                <Button variant="outline" size="icon-xs" disabled>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </Button>
              ) : installing ? (
                installingVersion === v.version ? (
                  <Button variant="outline" size="icon-xs" disabled>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </Button>
                ) : null
              ) : isThisInstalled ? (
                <Badge variant="success" size="sm" className="gap-1">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Installed
                </Badge>
              ) : incompatible ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          disabled
                          className={INSTALL_ACCENT.outlineButton}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Not compatible with your game version (you have{' '}
                      {gameVersion}, need {v.game_version})
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  variant="outline"
                  size="icon-xs"
                  className={INSTALL_ACCENT.outlineButton}
                  onClick={() => handleInstall(v.version, v.prerelease)}
                  disabled={mutationLocked}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
            </span>
          );
        }}
      />

      {prereleasePrompt && (
        <AppDialog
          open={!!prereleasePrompt}
          onOpenChange={(open) => {
            if (!open) setPrereleasePrompt(null);
          }}
          title="Install Beta Release"
          icon={AlertTriangle}
          description={
            <>
              <span className="font-semibold text-foreground">{itemName}</span>{' '}
              {prereleasePrompt.version} is a pre-release version and may be
              unstable or contain bugs.
            </>
          }
          tone="files"
          confirm={withLockAwareConfirm(
            {
              label: 'Install Anyway',
              onConfirm: () => {
                const version = prereleasePrompt.version;
                setPrereleasePrompt(null);
                doInstall(version);
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
              <span className="font-semibold text-foreground">{itemName}</span>{' '}
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
              <span className="font-semibold text-foreground">{itemName}</span>{' '}
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
          title={`Replace conflicting map for ${itemName}?`}
          description={`Installing ${itemName} ${conflictState.version} conflicts with an existing map. Replace the existing map to continue.`}
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
