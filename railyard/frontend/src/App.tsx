import { useWailsStartup } from '@subway-builder-modded/lifecycle-wails';
import { SuiteLoader, TooltipProvider } from '@subway-builder-modded/shared-ui';
import { Route, Switch, useLocation } from 'wouter';

import { DownloadNotification } from '@/components/layout/DownloadNotification';
import { Layout } from '@/components/layout/Layout';
import { RequestErrorDialog } from '@/components/layout/RequestErrorDialog';
import { SetupScreen } from '@/components/setup/SetupScreen';
import { Toaster } from '@/components/ui/sonner';
import { useTheme } from '@/hooks/use-theme';
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

interface DownloadCancelledEvent {
  itemId?: string;
}

function App() {
  useTheme();
  const [, setLocation] = useLocation();
  const updateInstalledLists = useInstalledStore((s) => s.updateInstalledLists);
  const acknowledgeCancel = useInstalledStore(
    (s) => s.acknowledgeCancelledInstall,
  );

  // Store state selectors for lifecycle coordination
  const configInitialized = useConfigStore((s) => s.initialized);
  const isConfigured = useConfigStore(
    (s) => s.validation?.isConfigured ?? false,
  );
  const setupCompleted = useConfigStore(
    (s) => s.config?.setupCompleted ?? false,
  );

  const profileInitialized = useProfileStore((s) => s.initialized);

  const registryInitialized = useRegistryStore((s) => s.initialized);
  const installedInitialized = useInstalledStore((s) => s.initialized);

  const showRegistrySteps = configInitialized && isConfigured && setupCompleted;
  const appReadyForNavigation =
    configInitialized &&
    profileInitialized &&
    (!showRegistrySteps || (registryInitialized && installedInitialized)) &&
    isConfigured &&
    setupCompleted;

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
        eventName: 'download:cancelled',
        handler: (payload: DownloadCancelledEvent) => {
          if (payload?.itemId) {
            acknowledgeCancel(payload.itemId);
          }
        },
      },
    ],
    phases: ({ startupReady: isBackendReady }) => [
      {
        name: 'bootstrap-user-state',
        enabled: isBackendReady,
        run: async () => {
          const { initialize: initializeConfig } = useConfigStore.getState();
          const { initialize: initializeProfile } = useProfileStore.getState();
          const { initialize: initializeGame } = useGameStore.getState();

          await initializeConfig();
          await initializeProfile();
          initializeGame();
        },
      },
      {
        name: 'bootstrap-registry-state',
        enabled: isBackendReady && configInitialized && isConfigured,
        run: async () => {
          const { initialize: initializeRegistry } =
            useRegistryStore.getState();
          const { initialize: initializeInstalled } =
            useInstalledStore.getState();

          await initializeRegistry();
          await initializeInstalled();
        },
      },
    ],
    consumePendingDeepLink: () => ConsumePendingDeepLink(),
    getProjectRoute: (type, id) => `/project/${type}/${encodeURIComponent(id)}`,
    launchGame: async () => {
      await LaunchGame();
    },
    canNavigatePendingRoute: appReadyForNavigation,
    navigate: (route) => setLocation(route),
  });

  const baseLoading =
    !startupReady || !configInitialized || !profileInitialized;
  const registryLoading =
    showRegistrySteps && (!registryInitialized || !installedInitialized);

  // Build loading states based on current initialization progress
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

  if (baseLoading || registryLoading) {
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

  return (
    <div className="railyard-accent">
      <TooltipProvider>
        <Layout>
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
            <Route path="*" component={HomePage} />
          </Switch>
        </Layout>
        <DownloadNotification />
        <ExtractNotification />
        <RequestErrorDialog />
        <Toaster />
      </TooltipProvider>
    </div>
  );
}

export default App;
