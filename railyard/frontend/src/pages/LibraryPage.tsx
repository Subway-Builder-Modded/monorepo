import { normalizeMapCountry } from '@subway-builder-modded/asset-listings-state';
import {
  AssetSidebarPanel,
  EmptyState,
  ErrorBanner,
  Pagination,
  ResultsSummary,
  SearchBar,
  SIDEBAR_CONTENT_OFFSET,
  SidebarFilters,
  type SidebarFilterState,
} from '@subway-builder-modded/asset-listings-ui';
import {
  buildAssetListingCounts,
  buildSpecialDemandValues,
  formatSourceQuality,
  LEVEL_OF_DETAIL_VALUES,
  LOCATION_TAGS,
  SEARCH_BAR_PLACEHOLDER,
  SEARCH_FILTER_EMPTY_LABELS,
  SOURCE_QUALITY_VALUES,
} from '@subway-builder-modded/config';
import { PER_PAGE_OPTIONS } from '@subway-builder-modded/config';
import { Button } from '@subway-builder-modded/shared-ui';
import { AppDialog } from '@subway-builder-modded/shared-ui';
import { getLocalAccentClasses } from '@subway-builder-modded/shared-ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@subway-builder-modded/shared-ui';
import { PageHeading } from '@subway-builder-modded/shared-ui';
import { cn } from '@subway-builder-modded/shared-ui';
import { Checkbox } from '@subway-builder-modded/shared-ui';
import { AlertTriangle, FileArchive, Inbox, Plus, SearchX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

import { LibraryActionBar } from '@/components/library/LibraryActionBar';
import { LibraryList } from '@/components/library/LibraryList';
import { AssetStatusFilterSection } from '@/components/shared/AssetStatusFilterSection';
import { SidebarPanel } from '@/components/shared/SidebarPanel';
import { useFilteredInstalledItems } from '@/hooks/use-filtered-installed-items';
import { useGameVersion } from '@/hooks/use-game-version';
import {
  handleSubscriptionMutationError,
  useSubscriptionMutationLockState,
  withLockAwareConfirm,
} from '@/lib/subscription-mutation-ui';
import {
  indexPendingSubscriptionUpdates,
  type PendingUpdatesByKey,
  requestLatestSubscriptionUpdatesForActiveProfile,
} from '@/lib/subscription-updates';
import { isInstalledCompatible } from '@/lib/version-compatibility';
import { useBrowseStore } from '@/stores/browse-store';
import { useDownloadQueueStore } from '@/stores/download-queue-store';
import {
  AssetConflictError,
  InvalidMapCodeError,
  useInstalledStore,
} from '@/stores/installed-store';
import { useLibraryStore } from '@/stores/library-store';
import { useRegistryStore } from '@/stores/registry-store';
import { useUIStore } from '@/stores/ui-store';

import { OpenImportAssetDialog } from '../../wailsjs/go/main/App';
import type { types } from '../../wailsjs/go/models';

function localManifestBase(
  id: string,
  name: string,
  description: string,
  authorAlias: string,
) {
  return {
    schema_version: 1,
    id,
    name,
    author: {
      author_id: authorAlias,
      author_alias: authorAlias,
      attribution_link: '',
    },
    github_id: 0,
    last_updated: 0,
    description,
    tags: [] as string[],
    gallery: [] as string[],
    source: '',
    update: { type: 'local' as const },
  };
}

function localMapManifestFromInstalled(
  installed: types.InstalledMapInfo,
): types.MapManifest | null {
  const config = installed.config;
  if (!config || !config.code) {
    return null;
  }

  return {
    ...localManifestBase(
      installed.id,
      config.name,
      config.description,
      config.creator,
    ),
    city_code: config.code,
    country: normalizeMapCountry(config.country),
    location: '',
    population: config.population,
    data_source: '',
    source_quality: '',
    level_of_detail: '',
    special_demand: [],
    initial_view_state: config.initialViewState ?? {
      latitude: 0,
      longitude: 0,
      zoom: 0,
      bearing: 0,
    },
  } as unknown as types.MapManifest;
}

function localModManifestFromInstalled(
  installed: types.InstalledModInfo,
): types.ModManifest | null {
  const installedManifest = installed.manifest;
  if (!installedManifest) {
    return null;
  }
  const authorName = installedManifest.author?.name ?? '';
  return {
    ...localManifestBase(
      installed.id,
      installedManifest.name ?? installed.id,
      installedManifest.description ?? '',
      authorName,
    ),
  } as unknown as types.ModManifest;
}

function conflictSourceLabel(conflict: types.MapCodeConflict): string {
  if (conflict.existingAssetId?.startsWith('vanilla:')) return 'Vanilla';
  return conflict.existingIsLocal ? 'Local' : 'Registry';
}

const INSTALL_ACCENT = getLocalAccentClasses('install');
const IMPORT_ACCENT = getLocalAccentClasses('import');
const FILES_ACCENT = getLocalAccentClasses('files');

export function LibraryPage() {
  const [, navigate] = useLocation();
  const { locked: mutationLocked, reason: mutationLockedReason } =
    useSubscriptionMutationLockState();
  const sidebarOpen = useUIStore((s) => s.librarySidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setLibrarySidebarOpen);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  // Conflict/invalid-code prompts pause the batch; the resolver refs let the
  // async import loop await the user's decision before continuing the queue.
  const [importConflict, setImportConflict] = useState<{
    conflict: types.MapCodeConflict;
    hasMore: boolean;
  } | null>(null);
  const [importInvalidCode, setImportInvalidCode] = useState<string | null>(
    null,
  );
  const [applyToAll, setApplyToAll] = useState(false);
  const conflictResolverRef = useRef<
    ((decision: { action: 'replace' | 'skip'; applyToAll: boolean }) => void)
    | null
  >(null);
  const invalidResolverRef = useRef<(() => void) | null>(null);
  const [pendingUpdatesByKey, setPendingUpdatesByKey] =
    useState<PendingUpdatesByKey>({});

  const statusFilters = useLibraryStore((s) => s.statusFilters);
  const toggleStatusFilter = useLibraryStore((s) => s.toggleStatusFilter);
  const gameVersion = useGameVersion();

  const mods = useRegistryStore((s) => s.mods);
  const maps = useRegistryStore((s) => s.maps);
  const modDownloadTotals = useRegistryStore((s) => s.modDownloadTotals);
  const mapDownloadTotals = useRegistryStore((s) => s.mapDownloadTotals);
  const ensureDownloadTotals = useRegistryStore((s) => s.ensureDownloadTotals);
  const installedMods = useInstalledStore((s) => s.installedMods);
  const installedMaps = useInstalledStore((s) => s.installedMaps);
  const updateInstalledLists = useInstalledStore((s) => s.updateInstalledLists);
  const importMapFromZip = useInstalledStore((s) => s.importMapFromZip);

  const refreshPendingSubscriptionUpdates = useCallback(async () => {
    let result;
    try {
      result = await requestLatestSubscriptionUpdatesForActiveProfile({
        apply: false,
      });
    } catch (err) {
      setPendingUpdatesByKey({});
      console.warn(
        `[library:latest_check] Failed to resolve pending updates: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    if (result.status === 'error') {
      setPendingUpdatesByKey({});
      console.warn(
        `[library:latest_check] Failed to resolve pending updates: ${result.message}`,
      );
      return;
    }

    setPendingUpdatesByKey(
      indexPendingSubscriptionUpdates(result.pendingUpdates),
    );
    if (result.status === 'warn') {
      console.warn(
        `[library:latest_check] Completed with warnings: ${result.message}`,
      );
    }
  }, []);

  useEffect(() => {
    ensureDownloadTotals();
    void refreshPendingSubscriptionUpdates();
  }, [ensureDownloadTotals, refreshPendingSubscriptionUpdates]);

  const modManifestById = useMemo(
    () => new Map(mods.map((manifest) => [manifest.id, manifest])),
    [mods],
  );
  const mapManifestById = useMemo(
    () => new Map(maps.map((manifest) => [manifest.id, manifest])),
    [maps],
  );

  const missingInstalledItems = useMemo(() => {
    const missingMods = installedMods
      .filter(
        (installed) => !installed.isLocal && !modManifestById.has(installed.id),
      )
      .map((installed) => `mod:${installed.id}`);
    const missingMaps = installedMaps
      .filter(
        (installed) => !installed.isLocal && !mapManifestById.has(installed.id),
      )
      .map((installed) => `map:${installed.id}`);
    return [...missingMods, ...missingMaps];
  }, [installedMaps, installedMods, mapManifestById, modManifestById]);

  const installedItems = useMemo(() => {
    const modItems = installedMods.flatMap((installed) => {
      const manifest = installed.isLocal
        ? localModManifestFromInstalled(installed)
        : modManifestById.get(installed.id);
      return manifest
        ? [
            {
              type: 'mod' as const,
              item: manifest,
              installedVersion: installed.version,
              installedSizeBytes: installed.installedSizeBytes ?? 0,
              isLocal: installed.isLocal,
              constraints: installed.constraints,
            },
          ]
        : [];
    });
    const mapItems = installedMaps.flatMap((installed) => {
      const manifest = installed.isLocal
        ? localMapManifestFromInstalled(installed)
        : mapManifestById.get(installed.id);
      if (manifest) {
        return [
          {
            type: 'map' as const,
            item: manifest,
            installedVersion: installed.version,
            installedSizeBytes: installed.installedSizeBytes ?? 0,
            isLocal: installed.isLocal,
            constraints: installed.constraints,
          },
        ];
      }

      return [];
    });

    return [...modItems, ...mapItems];
  }, [installedMods, installedMaps, modManifestById, mapManifestById]);

  const {
    items: paginatedItems,
    allFilteredItems,
    page,
    totalPages,
    totalResults,
    filters,
    setFilters,
    setType,
    setPage,
    dimCounts: filteredDimCounts,
  } = useFilteredInstalledItems({
    items: installedItems,
    modDownloadTotals,
    mapDownloadTotals,
  });

  const statusCounts = useMemo(() => {
    let local = 0,
      incompatible = 0,
      test = 0,
      compatible = 0;
    for (const item of installedItems) {
      if (item.type !== filters.type) continue;
      if (item.isLocal) local++;
      if (!item.isLocal && item.item.is_test === true) test++;
      if (isInstalledCompatible(gameVersion, item.constraints ?? []) === false)
        incompatible++;
      else compatible++;
    }
    return { local, incompatible, test, compatible };
  }, [installedItems, filters.type, gameVersion]);

  const handleInstallBrowse = useCallback(() => {
    useBrowseStore.getState().setType(filters.type);
    navigate('/browse');
  }, [filters.type, navigate]);

  const installedModItems = useMemo(
    () =>
      installedItems
        .filter((entry) => entry.type === 'mod')
        .map((entry) => entry.item),
    [installedItems],
  );
  const installedMapItems = useMemo(
    () =>
      installedItems
        .filter((entry) => entry.type === 'map')
        .map((entry) => entry.item),
    [installedItems],
  );

  const availableTags = useMemo(() => {
    const tags = new Set(installedModItems.flatMap((item) => item.tags ?? []));
    return Array.from(tags).sort();
  }, [installedModItems]);

  const availableSpecialDemand = useMemo(
    () => buildSpecialDemandValues(installedMapItems),
    [installedMapItems],
  );

  const availableDimCounts = useMemo(
    () => buildAssetListingCounts(installedModItems, installedMapItems),
    [installedMapItems, installedModItems],
  );

  // Pause the batch on a conflict and resolve once the user picks an action.
  const awaitConflictDecision = (
    conflict: types.MapCodeConflict,
    hasMore: boolean,
  ) =>
    new Promise<{ action: 'replace' | 'skip'; applyToAll: boolean }>(
      (resolve) => {
        conflictResolverRef.current = resolve;
        setApplyToAll(false);
        setImportConflict({ conflict, hasMore });
      },
    );

  // Pause the batch on an invalid map code until the user acknowledges it.
  const awaitInvalidAck = (message: string) =>
    new Promise<void>((resolve) => {
      invalidResolverRef.current = resolve;
      setImportInvalidCode(message);
    });

  const resolveConflict = (action: 'replace' | 'skip') => {
    const resolver = conflictResolverRef.current;
    conflictResolverRef.current = null;
    setImportConflict(null);
    resolver?.({ action, applyToAll });
  };

  const resolveInvalid = () => {
    const resolver = invalidResolverRef.current;
    invalidResolverRef.current = null;
    setImportInvalidCode(null);
    resolver?.();
  };

  const summarizeImport = (s: {
    imported: number;
    skipped: number;
    failed: number;
    total: number;
    aborted: boolean;
  }) => {
    if (s.aborted) return; // lock-error toast already shown
    if (s.total === 1) {
      if (s.imported) toast.success('Map imported successfully.');
      else if (s.failed) toast.error('Failed to import map.');
      return;
    }
    const parts: string[] = [];
    if (s.imported) parts.push(`${s.imported} imported`);
    if (s.skipped) parts.push(`${s.skipped} skipped`);
    if (s.failed) parts.push(`${s.failed} failed`);
    const summary = parts.join(', ');
    if (s.failed) toast.error(`Import finished: ${summary}.`);
    else if (s.skipped) toast.warning(`Import finished: ${summary}.`);
    else toast.success(`${s.imported} maps imported.`);
  };

  // Imports each archive in turn. The backend serializes the work; the queue
  // counter drives the same "n/N" progress indicator that installs use, and
  // conflicts/invalid codes pause the loop for a per-item decision.
  const runImportBatch = async (paths: string[]) => {
    if (paths.length === 0) return;
    const queue = useDownloadQueueStore.getState();
    paths.forEach(() => queue.enqueue());

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let processed = 0;
    let bulkMode: 'replace' | 'skip' | null = null;
    let aborted = false;

    for (let i = 0; i < paths.length && !aborted; i++) {
      const path = paths[i];
      const hasMore = i < paths.length - 1;

      if (bulkMode === 'skip') {
        skipped++;
        queue.complete();
        processed++;
        continue;
      }

      let replace = bulkMode === 'replace';
      let settled = false;
      while (!settled) {
        try {
          await importMapFromZip(path, replace);
          imported++;
          settled = true;
        } catch (err) {
          if (
            err instanceof AssetConflictError &&
            err.conflicts.length > 0 &&
            !replace
          ) {
            const decision = await awaitConflictDecision(
              err.conflicts[0],
              hasMore,
            );
            if (decision.applyToAll) bulkMode = decision.action;
            if (decision.action === 'skip') {
              skipped++;
              settled = true;
            } else {
              replace = true; // retry this archive with replacement
            }
          } else if (err instanceof InvalidMapCodeError) {
            await awaitInvalidAck(err.message);
            skipped++;
            settled = true;
          } else if (handleSubscriptionMutationError(err, () => {})) {
            aborted = true; // game running etc. — the rest will fail too
            settled = true;
          } else {
            failed++;
            settled = true;
          }
        }
      }
      queue.complete();
      processed++;
    }

    // Clear the counter for any archives the abort skipped.
    for (let k = processed; k < paths.length; k++) queue.complete();

    void updateInstalledLists();
    void refreshPendingSubscriptionUpdates();
    summarizeImport({ imported, skipped, failed, total: paths.length, aborted });
  };

  const handlePickArchive = async () => {
    if (importLoading) return;
    setImportLoading(true);
    try {
      const selection = await OpenImportAssetDialog('map');
      if (selection.status === 'error') {
        toast.error('Failed to open import dialog.');
        return;
      }
      const paths = selection.paths ?? [];
      if (selection.status === 'warn' || paths.length === 0) return;
      setImportDialogOpen(false);
      await runImportBatch(paths);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSidebarFiltersChange = useCallback(
    (updater: (prev: SidebarFilterState) => SidebarFilterState) => {
      setFilters((prev) => {
        const next = updater({
          type: prev.type,
          mod: { tags: prev.mod.tags },
          map: {
            locations: prev.map.locations,
            sourceQuality: prev.map.sourceQuality,
            levelOfDetail: prev.map.levelOfDetail,
            specialDemand: prev.map.specialDemand,
          },
        });
        return {
          ...prev,
          type: next.type,
          mod: { ...prev.mod, tags: next.mod.tags },
          map: {
            ...prev.map,
            locations: next.map.locations,
            sourceQuality: next.map.sourceQuality,
            levelOfDetail: next.map.levelOfDetail,
            specialDemand: next.map.specialDemand,
          },
        };
      });
    },
    [setFilters],
  );

  return (
    <>
      <AssetSidebarPanel
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        ariaLabel="Library filters"
        filters={filters}
        currentType={filters.type}
        onTypeChange={setType}
        renderPanel={({
          open,
          onToggle,
          ariaLabel,
          filters,
          collapsedContent,
          children,
        }) => (
          <SidebarPanel
            open={open}
            onToggle={onToggle}
            ariaLabel={ariaLabel}
            filters={filters}
            collapsedContent={collapsedContent}
          >
            {children}
          </SidebarPanel>
        )}
      >
        <SidebarFilters
          filters={filters}
          onFiltersChange={handleSidebarFiltersChange}
          onTypeChange={setType}
          availableTags={availableTags}
          availableSpecialDemand={availableSpecialDemand}
          dimCounts={{
            current: filteredDimCounts,
            available: availableDimCounts,
          }}
          modCount={filteredDimCounts.modCount}
          mapCount={filteredDimCounts.mapCount}
          locationValues={LOCATION_TAGS}
          sourceQualityValues={SOURCE_QUALITY_VALUES}
          levelOfDetailValues={LEVEL_OF_DETAIL_VALUES}
          formatSourceQuality={formatSourceQuality}
          emptyLabels={SEARCH_FILTER_EMPTY_LABELS}
          minimumVisibleOptions={2}
          statusContent={
            <AssetStatusFilterSection
              activeFilters={statusFilters}
              counts={statusCounts}
              onToggle={toggleStatusFilter}
            />
          }
        />
      </AssetSidebarPanel>

      <div
        className="space-y-5"
        style={{
          paddingLeft: sidebarOpen ? SIDEBAR_CONTENT_OFFSET : '0px',
          transition: 'padding-left 200ms ease-out',
          minHeight: 'calc(100vh - var(--app-navbar-offset))',
        }}
      >
        <PageHeading
          icon={Inbox}
          title="Library"
          description="View and manage your installed community-made content."
        />

        {missingInstalledItems.length > 0 && (
          <ErrorBanner
            message={
              missingInstalledItems.length === 1
                ? `Installed content is missing from the registry: ${missingInstalledItems[0]}`
                : `${missingInstalledItems.length} installed items are missing from the registry.`
            }
          />
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              query={filters.query}
              onQueryChange={(value) =>
                setFilters((prev) => ({ ...prev, query: value }))
              }
              placeholder={SEARCH_BAR_PLACEHOLDER}
              ariaLabel="Search installed mods and maps"
              debounceMs={150}
            />
          </div>
          <Button
            className={`shrink-0 gap-1.5 ${INSTALL_ACCENT.solidButton}`}
            onClick={handleInstallBrowse}
          >
            <Plus className="h-4 w-4" />
            {filters.type === 'map' ? 'Install Maps' : 'Install Mods'}
          </Button>
          <Button
            variant="outline"
            className={`shrink-0 gap-1.5 ${IMPORT_ACCENT.outlineButton}`}
            onClick={() => setImportDialogOpen(true)}
            disabled={mutationLocked}
          >
            <Inbox className="h-4 w-4" />
            Import Asset
          </Button>
        </div>

        {installedItems.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No content installed"
            description="Your library is empty. Browse the registry to discover and install community-made content."
          >
            <Button
              className={`gap-1.5 ${INSTALL_ACCENT.solidButton}`}
              onClick={handleInstallBrowse}
            >
              <Plus className="h-4 w-4" />
              {filters.type === 'map' ? 'Install Maps' : 'Install Mods'}
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <ResultsSummary totalResults={totalResults} query={filters.query} />

            {paginatedItems.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={
                  filters.type === 'map' ? 'No maps found' : 'No mods found'
                }
                description={
                  filters.query
                    ? `No installed ${filters.type} match "${filters.query}"`
                    : `No installed ${filters.type} match the current filters`
                }
              />
            ) : (
              <>
                <LibraryList
                  items={paginatedItems}
                  activeType={filters.type}
                  pendingUpdatesByKey={pendingUpdatesByKey}
                  onRefreshPendingUpdates={refreshPendingSubscriptionUpdates}
                  sort={filters.sort}
                  onSortChange={(value) =>
                    setFilters((prev) => ({ ...prev, sort: value }))
                  }
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  perPage={filters.perPage}
                  perPageOptions={PER_PAGE_OPTIONS}
                  onPageChange={setPage}
                  onPerPageChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      perPage: value as (typeof prev)['perPage'],
                    }))
                  }
                  renderPerPageControl={({ value, options, onChange }) => (
                    <Select
                      value={String(value)}
                      onValueChange={(v) => onChange(Number(v))}
                    >
                      <SelectTrigger className="w-16 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt) => (
                          <SelectItem
                            key={opt}
                            value={String(opt)}
                            className="text-xs"
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </>
            )}

            <div className="sticky bottom-4">
              <LibraryActionBar
                allItems={allFilteredItems}
                pendingUpdatesByKey={pendingUpdatesByKey}
                onRefreshPendingUpdates={refreshPendingSubscriptionUpdates}
              />
            </div>
          </div>
        )}
      </div>

      <AppDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Import"
        icon={FileArchive}
        description="Import one or more local map ZIPs into your Library. Select multiple archives to queue them together. Local assets are tracked separately from registry assets."
        tone="import"
        confirm={withLockAwareConfirm(
          {
            label: 'Choose ZIPs',
            cancelLabel: 'Close',
            onConfirm: handlePickArchive,
            loading: importLoading,
          },
          mutationLocked,
          mutationLockedReason,
        )}
      >
        <div
          className={cn(
            IMPORT_ACCENT.dialogPanel,
            'min-w-0 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground',
          )}
        >
          Asset Type: <span className="font-medium text-foreground">Map</span>
        </div>
      </AppDialog>

      {importConflict && (
        <AppDialog
          open={!!importConflict}
          onOpenChange={(value) => {
            if (!value) resolveConflict('skip');
          }}
          title="Replace Conflicting Map"
          icon={AlertTriangle}
          description="This local import conflicts with an existing map. Replace it, or skip this archive and continue."
          tone="files"
          confirm={{
            label:
              applyToAll && importConflict.hasMore ? 'Replace all' : 'Replace',
            cancelLabel:
              applyToAll && importConflict.hasMore ? 'Skip all' : 'Skip',
            onConfirm: () => resolveConflict('replace'),
          }}
        >
          <div
            className={cn(
              FILES_ACCENT.dialogPanel,
              'rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground',
            )}
          >
            <p className="font-medium text-foreground">
              Conflicting City Code: {importConflict.conflict.cityCode}
            </p>
            <p className="mt-1">
              Existing Asset: {importConflict.conflict.existingAssetId} (
              {conflictSourceLabel(importConflict.conflict)})
            </p>
            {importConflict.conflict.existingVersion ? (
              <p className="mt-1">
                Existing Version: {importConflict.conflict.existingVersion}
              </p>
            ) : null}
          </div>
          {importConflict.hasMore && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={applyToAll}
                onCheckedChange={(value) => setApplyToAll(value === true)}
                className="h-4 w-4"
              />
              Apply to all remaining conflicts
            </label>
          )}
        </AppDialog>
      )}

      {importInvalidCode && (
        <AppDialog
          open={!!importInvalidCode}
          onOpenChange={(value) => {
            if (!value) resolveInvalid();
          }}
          title="Invalid Local Map Code"
          icon={AlertTriangle}
          description={`${importInvalidCode} Local map codes must be 2-4 uppercase letters (e.g. "AAA").`}
          tone="files"
          confirm={{ label: 'Skip', onConfirm: resolveInvalid }}
        />
      )}
    </>
  );
}
