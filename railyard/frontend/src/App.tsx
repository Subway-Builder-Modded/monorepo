import { useWailsStartup } from '@subway-builder-modded/lifecycle-wails';
import { SuiteLoader, TooltipProvider } from '@subway-builder-modded/shared-ui';
import { useEffect, useRef } from 'react';
import { Route, Switch, useLocation } from 'wouter';

import { DownloadNotification } from '@/components/layout/DownloadNotification';
import { Layout } from '@/components/layout/Layout';
import { RequestErrorDialog } from '@/components/layout/RequestErrorDialog';
import { SetupScreen } from '@/components/setup/SetupScreen';
import { Toaster } from '@/components/ui/sonner';
import { GameVersionProvider } from '@/hooks/use-game-version';
import { IncompatibleAssetKeysProvider } from '@/hooks/use-incompatible-asset-keys';
import { useTheme } from '@/hooks/use-theme';
import { markFirst, measureAsync } from '@/lib/perf';
import { BrowsePage } from '@/pages/BrowsePage';
import { ChangelogPage } from '@/pages/ChangelogPage';
import { HomePage } from '@/pages/HomePage';
import { LibraryPage } from '@/pages/LibraryPage';
import { LogsPage } from '@/pages/LogsPage';
import { ProfilesPage } from '@/pages/ProfilesPage';
import { ProjectPage } from '@/pages/ProjectPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useConfigStore } from '@/stores/config-store';
import { useGameStore } from '@/stores/game-store';
import { useInstalledStore } from '@/stores/installed-store';
import { useProfileStore } from '@/stores/profile-store';
import { useRegistryStore } from '@/stores/registry-store';

import {
  ConsumePendingDeepLink,
  IsStartupReady,
  LaunchGame,
} from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { ExtractNotification } from './components/layout/ExtractNotification';
import { RegistryRefreshNotification } from './components/layout/RegistryRefreshNotification';

interface DownloadCancelledEvent {
  itemId?: string;
}

interface RegistryRefreshProgressEvent {
  stage?: string;
}

// Delay before the frontend triggers the startup registry refresh, measured from when the
// app becomes interactive.
// Ideally the dealy should be long enough for first paint + gallery image decode to settle so
// the  git fetch doesn't compete with CPU resources.
const STARTUP_REFRESH_DELAY_MS = 2000;

function App() {
  useTheme();
  const [location, setLocation] = useLocation();
  const updateInstalledLists = useInstalledStore((s) => s.updateInstalledLists);
  const acknowledgeCancel = useInstalledStore(
    (s) => s.acknowledgeCancelledInstall,
  );

  // Store state selectors for lifecycle coordination
  const configInitialized = useConfigStore((s) => s.initialized);
  const usingSteam = useConfigStore((s) => s.config?.useSteamLaunch ?? false);
  const isConfigured = useConfigStore(
    (s) => s.validation?.isConfigured ?? false,
  );
  const setupCompleted = useConfigStore(
    (s) => s.config?.setupCompleted ?? false,
  );

  const profileInitialized = useProfileStore((s) => s.initialized);

  const registryInitialized = useRegistryStore((s) => s.initialized);
  const installedInitialized = useInstalledStore((s) => s.initialized);
  const setStartupRefreshing = useRegistryStore((s) => s.setStartupRefreshing);
  const registryRefresh = useRegistryStore((s) => s.refresh);
  const refreshRegistryOnStartup = useProfileStore(
    (s) => s.profile?.systemPreferences?.refreshRegistryOnStartup ?? false,
  );
  const startupRefreshTriggered = useRef(false);
  // Track which keep-alive tab pages have been visited, so we mount each on first visit and
  // then keep it mounted (hidden) across navigation.
  const mountedTabs = useRef({ home: false, browse: false, library: false });

  const showRegistrySteps = configInitialized && isConfigured && setupCompleted;
  const appReadyForNavigation =
    configInitialized &&
    profileInitialized &&
    (!showRegistrySteps || (registryInitialized && installedInitialized)) &&
    isConfigured &&
    setupCompleted;

  // Kick off the registry refresh (git fetch) on startup if the user has enabled it in preferences.
  useEffect(() => {
    if (startupRefreshTriggered.current) return;
    if (!appReadyForNavigation || !refreshRegistryOnStartup) return;
    startupRefreshTriggered.current = true;

    window.setTimeout(() => void registryRefresh(), STARTUP_REFRESH_DELAY_MS);
  }, [appReadyForNavigation, refreshRegistryOnStartup, registryRefresh]);

  const { startupReady, fatalError } = useWailsStartup({
    subscribe: (eventName, handler) => EventsOn(eventName, handler),
    pollStartupReady: async () => {
      try {
        const readyResponse = await IsStartupReady();
        return readyResponse.status === 'success' && readyResponse.ready;
      } catch {
        return false;
      }
    },
    eventSubscriptions: [
      {
        eventName: 'registry:update',
        handler: () => {
          void updateInstalledLists();
        },
      },
      {
        eventName: 'registry:ready',
        handler: () => {
          void useRegistryStore.getState().reload();
          // Registry init has now loaded download counts into memory. Force a refetch so any
          // totals that resolved empty during the startup window (before counts were
          // populated) are replaced rather than left cached as zero.
          void useRegistryStore
            .getState()
            .ensureDownloadTotals({ force: true });
          void useInstalledStore.getState().updateInstalledLists();
        },
      },
      {
        eventName: 'download:cancelled',
        handler: (payload: DownloadCancelledEvent) => {
          if (payload?.itemId) {
            acknowledgeCancel(payload.itemId);
          }
        },
      },
      {
        // Gate the navbar refresh button to prevent concurrent clone requests, preventing interaction if the registry is already being refreshed as part of startup.
        // We set set refreshing state `true` only if we see a non terminal git clone stage increment (to prevent hanging state when our listener attaches after completion of the refresh)
        eventName: 'registry:refresh-progress',
        handler: (payload: RegistryRefreshProgressEvent) => {
          if (payload?.stage === 'complete' || payload?.stage === 'error') {
            setStartupRefreshing(false);
          } else if (payload?.stage) {
            setStartupRefreshing(true);
          }
        },
      },
    ],
    phases: ({ startupReady: isBackendReady }) => [
      {
        name: 'bootstrap-user-state',
        enabled: isBackendReady,
        run: () =>
          measureAsync('startup.bootstrap-user-state', async () => {
            const { initialize: initializeConfig } = useConfigStore.getState();
            const { initialize: initializeProfile } =
              useProfileStore.getState();
            const { initialize: initializeGame } = useGameStore.getState();

            await initializeConfig();
            await initializeProfile();
            initializeGame();
          }),
      },
      {
        name: 'bootstrap-registry-state',
        enabled: isBackendReady && configInitialized && isConfigured,
        run: () =>
          measureAsync('startup.bootstrap-registry-state', async () => {
            const { initialize: initializeRegistry } =
              useRegistryStore.getState();
            const { initialize: initializeInstalled } =
              useInstalledStore.getState();

            await initializeRegistry();
            await initializeInstalled();
          }),
      },
    ],
    consumePendingDeepLink: () => ConsumePendingDeepLink(),
    getProjectRoute: (type, id) => `/project/${type}/${encodeURIComponent(id)}`,
    launchGame: async () => {
      await LaunchGame(false);
    },
    canNavigatePendingRoute: appReadyForNavigation,
    navigate: (route) => setLocation(route),
  });

  // Mark each cold-start milestone once (markFirst is idempotent).
  // Store this in the persisted perf log to make any future startup regression visible as a shifted timestamp.
  useEffect(() => {
    if (startupReady) markFirst('startup.backend-ready');
    if (configInitialized && profileInitialized) {
      markFirst('startup.user-state-ready');
    }
    if (registryInitialized && installedInitialized) {
      markFirst('startup.registry-ready');
    }
    if (appReadyForNavigation) markFirst('startup.app-interactive');
  }, [
    startupReady,
    configInitialized,
    profileInitialized,
    registryInitialized,
    installedInitialized,
    appReadyForNavigation,
  ]);

  const baseLoading =
    !startupReady || !configInitialized || !profileInitialized;

  // Build loading states based on current initialization progress
  const loadingStates = [
    { text: 'Starting backend services' },
    { text: 'Loading configuration' },
    { text: 'Applying theme preferences' },
    { text: 'Loading user profile' },
  ];

  let currentStep = 0;
  if (startupReady) currentStep = 1;
  if (startupReady && configInitialized) currentStep = 2;
  if (startupReady && configInitialized) currentStep = 3;
  if (startupReady && configInitialized && profileInitialized) currentStep = 4;

  if (baseLoading) {
    return (
      <div className="railyard-accent">
        <SuiteLoader
          title="Railyard"
          steps={loadingStates}
          currentStep={currentStep}
        />
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="railyard-accent min-h-screen w-full bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10">
          <div className="w-full rounded-xl border border-destructive/35 bg-card/70 p-6">
            <h1 className="text-lg font-semibold text-foreground">
              Railyard encountered an error
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A runtime error has occurred in Railyard. Please report this error
              to the developers.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-md bg-background/80 p-3 text-xs text-destructive">
              {fatalError}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Gate: show setup if not configured OR setup not completed
  if (!isConfigured || !setupCompleted) {
    return (
      <div className="railyard-accent">
        <SetupScreen />
        <Toaster />
      </div>
    );
  }

  // Route classification for the keep-alive tabs. Home is the default/fallback; the remaining routes are rendered by the <Switch> below.
  const isLibraryRoute = location === '/library';
  const isBrowseRoute = location === '/browse' || location === '/search';
  const isOtherRoute =
    location.startsWith('/project/') ||
    location === '/profiles' ||
    location === '/logs' ||
    location === '/settings';
  const isHomeRoute = !isLibraryRoute && !isBrowseRoute && !isOtherRoute;

  // Mount a tab the first time it is visited, then keep it mounted afterwards.
  if (isHomeRoute) mountedTabs.current.home = true;
  if (isBrowseRoute) mountedTabs.current.browse = true;
  if (isLibraryRoute) mountedTabs.current.library = true;

  // display:contents makes the active tab's wrapper transparent to layout (identical to
  // rendering the page directly); inactive tabs stay mounted but display:none.
  const tabStyle = (active: boolean) =>
    ({ display: active ? 'contents' : 'none' }) as const;

  return (
    <div className="railyard-accent">
      <TooltipProvider>
        <GameVersionProvider>
          <IncompatibleAssetKeysProvider>
            <Layout>
              {mountedTabs.current.home && (
                <div style={tabStyle(isHomeRoute)}>
                  <HomePage />
                </div>
              )}
              {mountedTabs.current.browse && (
                <div style={tabStyle(isBrowseRoute)}>
                  <BrowsePage />
                </div>
              )}
              {mountedTabs.current.library && (
                <div style={tabStyle(isLibraryRoute)}>
                  <LibraryPage />
                </div>
              )}
              <Switch>
                <Route
                  path="/project/:type/:id/changelog/:version"
                  component={ChangelogPage}
                />
                <Route path="/project/:type/:id" component={ProjectPage} />
                <Route path="/profiles" component={ProfilesPage} />
                {!usingSteam && <Route path="/logs" component={LogsPage} />}
                <Route path="/settings" component={SettingsPage} />
              </Switch>
            </Layout>
            <DownloadNotification />
            <ExtractNotification />
            <RegistryRefreshNotification />
            <RequestErrorDialog />
            <Toaster />
          </IncompatibleAssetKeysProvider>
        </GameVersionProvider>
      </TooltipProvider>
    </div>
  );
}

export default App;
