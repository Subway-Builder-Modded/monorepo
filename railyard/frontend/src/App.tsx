import { useCallback, useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';

import { DownloadNotification } from '@sbm/railyard/components/layout/DownloadNotification';
import { Layout } from '@sbm/railyard/components/layout/Layout';
import { Navbar } from '@sbm/railyard/components/layout/Navbar';
import { MultiStepLoader } from '@sbm/railyard/components/layout/MultiStepLoader';
import { RequestErrorNotification } from '@sbm/railyard/components/layout/RequestErrorNotification';
import { SetupScreen } from '@sbm/railyard/components/setup/SetupScreen';
import { Toaster } from '@sbm/railyard/components/ui/sonner';
import { TooltipProvider } from '@sbm/railyard/components/ui/tooltip';
import { useTheme } from '@sbm/railyard/hooks/use-theme';
import { BrowsePage } from '@/pages/BrowsePage';
import { ChangelogPage } from '@/pages/ChangelogPage';
import { HomePage } from '@/pages/HomePage';
import { LibraryPage } from '@/pages/LibraryPage';
import { LogsPage } from '@/pages/LogsPage';
import { ProfilesPage } from '@/pages/ProfilesPage';
import { ProjectPage } from '@/pages/ProjectPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useConfigStore } from '@/stores/config-store';
import { useDownloadQueueStore } from '@/stores/download-queue-store';
import { useGameStore } from '@/stores/game-store';
import { useInstalledStore } from '@/stores/installed-store';
import { useProfileStore } from '@/stores/profile-store';
import { useRegistryStore } from '@/stores/registry-store';

import {
  ConsumePendingDeepLink,
  GetCurrentVersion,
  IsStartupReady,
  LaunchGame,
} from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { ExtractNotification } from '@sbm/railyard/components/layout/ExtractNotification';

interface DownloadCancelledEvent {
  itemId?: string;
}

interface DeepLinkEvent {
  type?: string;
  id?: string;
}

function App() {
  useTheme();
  const [, setLocation] = useLocation();
  const [startupReady, setStartupReady] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [pendingDeepLinkRoute, setPendingDeepLinkRoute] = useState<
    string | null
  >(null);
  const updateInstalledLists = useInstalledStore((s) => s.updateInstalledLists);
  const acknowledgeCancel = useInstalledStore(
    (s) => s.acknowledgeCancelledInstall,
  );
  const installedMaps = useInstalledStore((s) => s.installedMaps);

  const initConfig = useConfigStore((s) => s.initialize);
  const configInitialized = useConfigStore((s) => s.initialized);
  const isConfigured = useConfigStore(
    (s) => s.validation?.isConfigured ?? false,
  );
  const setupCompleted = useConfigStore(
    (s) => s.config?.setupCompleted ?? false,
  );
  const config = useConfigStore((s) => s.config);
  const validation = useConfigStore((s) => s.validation);
  const openDataFolderDialog = useConfigStore((s) => s.openDataFolderDialog);
  const openExecutableDialog = useConfigStore((s) => s.openExecutableDialog);
  const updateCheckForUpdatesOnLaunch = useConfigStore(
    (s) => s.updateCheckForUpdatesOnLaunch,
  );
  const updateGithubToken = useConfigStore((s) => s.updateGithubToken);
  const completeSetup = useConfigStore((s) => s.completeSetup);
  const canLaunch = useConfigStore((s) => s.validation?.executablePathValid);

  const initProfile = useProfileStore((s) => s.initialize);

  const initRegistry = useRegistryStore((s) => s.initialize);
  const registryInitialized = useRegistryStore((s) => s.initialized);
  const registryRefresh = useRegistryStore((s) => s.refresh);
  const registryRefreshing = useRegistryStore((s) => s.refreshing);
  const initInstalled = useInstalledStore((s) => s.initialize);
  const installedInitialized = useInstalledStore((s) => s.initialized);
  const profileInitialized = useProfileStore((s) => s.initialized);
  const initGame = useGameStore((s) => s.initialize);
  const gameRunning = useGameStore((s) => s.running);
  const gameLaunch = useGameStore((s) => s.launch);
  const gameStop = useGameStore((s) => s.stop);

  useEffect(() => {
    GetCurrentVersion().then((response) => {
      if (response.status !== 'success') return;
      const sanitized = [...(response.version || '')]
        .filter((c) => c !== '\u0000')
        .join('');
      setAppVersion(sanitized);
    });
  }, []);

  const getIsInstalling = useCallback(
    (itemId: string) => useInstalledStore.getState().isInstalling(itemId),
    [],
  );
  const getQueueState = useCallback(
    () => {
      const s = useDownloadQueueStore.getState();
      return { completed: s.completed, total: s.total };
    },
    [],
  );

  useEffect(() => {
    updateInstalledLists();
    const downloadCancelled = EventsOn(
      'download:cancelled',
      (payload: DownloadCancelledEvent) => {
        if (!payload?.itemId) {
          return;
        }
        acknowledgeCancel(payload.itemId);
      },
    );
    const deepLinkOpened = EventsOn(
      'deeplink:open',
      (payload: DeepLinkEvent) => {
        const routeType = payload?.type;
        const routeID = payload?.id;
        if (!routeType || !routeID) {
          return;
        }
        setPendingDeepLinkRoute(
          `/project/${routeType}/${encodeURIComponent(routeID)}`,
        );
      },
    );
    let cancelled = false;
    let timer: number | undefined;

    const pollStartupReady = async () => {
      try {
        const readyResponse = await IsStartupReady();
        if (cancelled) return;
        if (readyResponse.status === 'success' && readyResponse.ready) {
          setStartupReady(true);
          return;
        }
      } catch {
        // Keep polling while backend startup is still in progress.
      }

      if (!cancelled) {
        timer = window.setTimeout(pollStartupReady, 250);
      }
    };

    pollStartupReady();

    return () => {
      downloadCancelled();
      deepLinkOpened();
      cancelled = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [updateInstalledLists, acknowledgeCancel]);

  // Phase 1: config + profile + game events
  useEffect(() => {
    if (!startupReady) return;
    initConfig();
    initProfile();
    initGame();
  }, [startupReady, initConfig, initProfile, initGame]);

  // Phase 2: registry + installed (only when configured)
  useEffect(() => {
    if (startupReady && configInitialized && isConfigured) {
      initRegistry();
      initInstalled();
    }
  }, [
    startupReady,
    configInitialized,
    isConfigured,
    initRegistry,
    initInstalled,
  ]);

  // Build loading states based on current initialization progress
  const showRegistrySteps = configInitialized && isConfigured && setupCompleted;
  const loadingStates = [
    { text: 'Starting backend services' },
    { text: 'Loading configuration' },
    { text: 'Applying theme preferences' },
    { text: 'Loading user profile' },
    ...(showRegistrySteps
      ? [
          { text: 'Connecting to registry' },
          { text: 'Loading installed content' },
        ]
      : []),
  ];

  let currentStep = 0;
  if (startupReady) currentStep = 1;
  if (startupReady && configInitialized) currentStep = 2;
  if (startupReady && configInitialized) currentStep = 3;
  if (startupReady && configInitialized && profileInitialized) {
    currentStep = 3;
    if (showRegistrySteps) {
      currentStep = 4;
      if (registryInitialized) currentStep = 5;
      if (registryInitialized && installedInitialized) currentStep = 6;
    }
  }

  const baseLoading =
    !startupReady || !configInitialized || !profileInitialized;
  const registryLoading =
    showRegistrySteps && (!registryInitialized || !installedInitialized);

  useEffect(() => {
    if (!startupReady) return;

    ConsumePendingDeepLink()
      .then((response) => {
        if (response.status !== 'success') {
          return;
        }
        if (response.target?.type === 'GameStart') {
          LaunchGame().catch(() => {});
          return;
        }
        const routeType = response.target?.type;
        const routeID = response.target?.id;
        if (!routeType || !routeID) {
          return;
        }
        setPendingDeepLinkRoute(
          `/project/${routeType}/${encodeURIComponent(routeID)}`,
        );
      })
      .catch(() => {});
  }, [startupReady]);

  useEffect(() => {
    if (baseLoading || registryLoading || !isConfigured || !setupCompleted) {
      return;
    }
    if (!pendingDeepLinkRoute) {
      return;
    }

    setLocation(pendingDeepLinkRoute);
    setPendingDeepLinkRoute(null);
  }, [
    baseLoading,
    registryLoading,
    isConfigured,
    pendingDeepLinkRoute,
    setLocation,
    setupCompleted,
  ]);

  if (baseLoading || registryLoading) {
    return (
      <div className="railyard-accent">
        <MultiStepLoader
          loadingStates={loadingStates}
          currentStep={currentStep}
        />
      </div>
    );
  }

  // Gate: show setup if not configured OR setup not completed
  if (!isConfigured || !setupCompleted) {
    return (
      <div className="railyard-accent">
        <SetupScreen
          config={config}
          validation={validation}
          openDataFolderDialog={openDataFolderDialog}
          openExecutableDialog={openExecutableDialog}
          updateCheckForUpdatesOnLaunch={updateCheckForUpdatesOnLaunch}
          updateGithubToken={updateGithubToken}
          completeSetup={completeSetup}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="railyard-accent">
      <TooltipProvider>
        <Layout
          appVersion={appVersion}
          navbar={
            <Navbar
              registryLoading={registryLoading}
              registryRefreshing={registryRefreshing}
              onRefreshRegistry={registryRefresh}
              canLaunch={canLaunch}
              gameRunning={gameRunning}
              onLaunchGame={gameLaunch}
              onStopGame={gameStop}
              hasInstalledMaps={installedMaps.length > 0}
            />
          }
        >
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/library" component={LibraryPage} />
            <Route path="/browse" component={BrowsePage} />
            <Route path="/search" component={BrowsePage} />
            <Route
              path="/project/:type/:id/changelog/:version"
              component={ChangelogPage}
            />
            <Route path="/project/:type/:id" component={ProjectPage} />
            <Route path="/profiles" component={ProfilesPage} />
            <Route path="/logs" component={LogsPage} />
            <Route path="/settings" component={SettingsPage} />
          </Switch>
        </Layout>
        <DownloadNotification
          getIsInstalling={getIsInstalling}
          getQueueState={getQueueState}
        />
        <ExtractNotification />
        <RequestErrorNotification />
        <Toaster />
      </TooltipProvider>
    </div>
  );
}

export default App;
