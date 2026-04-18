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
import { AlertTriangle, FileArchive, Inbox, Plus, SearchX } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

import { LibraryActionBar } from '@/components/library/LibraryActionBar';
import { LibraryList } from '@/components/library/LibraryList';
import { SidebarPanel } from '@/components/shared/SidebarPanel';
import { useFilteredInstalledItems } from '@/hooks/use-filtered-installed-items';
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
import { useBrowseStore } from '@/stores/browse-store';
import {
  AssetConflictError,
  InvalidMapCodeError,
  useInstalledStore,
} from '@/stores/installed-store';
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
    country: config.country ?? '',
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

function renderPathWithSoftBreaks(path: string) {
  // We want strict bounds in the dialog without breaking mid-segment.
  // Insert optional break points after path separators.
  const parts = path.split(/([\\/])/g);
  return parts.map((part, idx) => {
    if (part === '/' || part === '\\') {
      return (
        <Fragment key={`${idx}-sep`}>
          {part}
          <wbr />
        </Fragment>
      );
    }
    return <Fragment key={`${idx}-txt`}>{part}</Fragment>;
  });
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
  const [importSelectedPath, setImportSelectedPath] = useState('');
  const [importConflict, setImportConflict] =
    useState<types.MapCodeConflict | null>(null);
  const [importInvalidCode, setImportInvalidCode] = useState<string | null>(
    null,
  );
  const [pendingUpdatesByKey, setPendingUpdatesByKey] =
    useState<PendingUpdatesByKey>({});

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

  const runImport = async (zipPath: string, replaceOnConflict: boolean) => {
    setImportLoading(true);
    try {
      const result = await importMapFromZip(zipPath, replaceOnConflict);
      if (result.status === 'warn') {
        toast.warning(result.message || 'Map imported with warnings.');
      } else {
        toast.success(result.message || 'Map imported successfully.');
      }
      void updateInstalledLists();
      void refreshPendingSubscriptionUpdates();
      setImportConflict(null);
      setImportSelectedPath('');
      setImportDialogOpen(false);
    } catch (err) {
      if (err instanceof AssetConflictError && err.conflicts.length > 0) {
        setImportConflict(err.conflicts[0]);
        return;
      }
      if (err instanceof InvalidMapCodeError) {
        setImportInvalidCode(err.message);
        return;
      }
      if (handleSubscriptionMutationError(err, () => {})) {
        return;
      }
      setImportSelectedPath('');
      toast.error('Failed to import map.');
    } finally {
      setImportLoading(false);
    }
  };

  const handlePickArchive = async () => {
    if (importLoading) return;
    setImportLoading(true);
    try {
      const selection = await OpenImportAssetDialog('map');
      if (selection.status === 'error') {
        toast.error('Failed to import map.');
        return;
      }
      if (selection.status === 'warn' || !selection.path?.trim()) {
        return;
      }
      setImportSelectedPath(selection.path);
      await runImport(selection.path, false);
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
        description="Import a local map ZIP into your Library. Local assets are tracked separately from registry assets."
        tone="import"
        confirm={withLockAwareConfirm(
          {
            label: 'Choose ZIP',
            cancelLabel: 'Close',
            onConfirm: handlePickArchive,
            loading: importLoading,
          },
          mutationLocked,
          mutationLockedReason,
        )}
      >
        <div className="min-w-0 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Asset Type: <span className="font-medium text-foreground">Map</span>
          {importSelectedPath ? (
            <p className="mt-1 min-w-0 max-w-full overflow-hidden whitespace-normal">
              Selected Archive:{' '}
              <span className="text-foreground font-mono">
                {renderPathWithSoftBreaks(importSelectedPath)}
              </span>
            </p>
          ) : null}
        </div>
      </AppDialog>

      {importConflict && (
        <AppDialog
          open={!!importConflict}
          onOpenChange={(value) => {
            if (!value) setImportConflict(null);
          }}
          title="Replace Conflicting Map"
          icon={AlertTriangle}
          description="This local import conflicts with an existing map. Replace the existing map to continue."
          tone="files"
          confirm={withLockAwareConfirm(
            {
              label: 'Replace',
              onConfirm: () => {
                if (!importSelectedPath) return;
                void runImport(importSelectedPath, true);
              },
              loading: importLoading,
            },
            mutationLocked,
            mutationLockedReason,
          )}
        >
          <div
            className={`rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground ${FILES_ACCENT.dialogPanel}`}
          >
            <p className="font-medium text-foreground">
              Conflicting City Code: {importConflict.cityCode}
            </p>
            <p className="mt-1">
              Existing Asset: {importConflict.existingAssetId} (
              {conflictSourceLabel(importConflict)})
            </p>
            {importConflict.existingVersion ? (
              <p className="mt-1">
                Existing Version: {importConflict.existingVersion}
              </p>
            ) : null}
          </div>
        </AppDialog>
      )}

      {importInvalidCode && (
        <AppDialog
          open={!!importInvalidCode}
          onOpenChange={(value) => {
            if (!value) setImportInvalidCode(null);
          }}
          title="Invalid Local Map Code"
          icon={AlertTriangle}
          description={`${importInvalidCode} Local map codes must be 2-4 uppercase letters (e.g. "AAA").`}
          tone="files"
          confirm={{ label: 'OK', onConfirm: () => setImportInvalidCode(null) }}
        />
      )}
    </>
  );
}
