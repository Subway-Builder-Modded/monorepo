import { CircleUser, Settings } from 'lucide-react';
import { useEffect } from 'react';

import { DangerZonePanel } from '@sbm/railyard/components/settings/DangerZonePanel';
import { GeneralSettingsPanel } from '@sbm/railyard/components/settings/GeneralSettingsPanel';
import {
  SettingsNav,
  type SettingsTab,
} from '@sbm/railyard/components/settings/SettingsNav';
import { SystemPreferencesPanel } from '@sbm/railyard/components/settings/SystemPreferencesPanel';
import { UIPreferencesPanel } from '@sbm/railyard/components/settings/UIPreferencesPanel';
import { PageHeading } from '@sbm/railyard/components/shared/PageHeading';
import { Badge } from '@sbm/shared/ui/badge';
import { useConfigStore } from '@/stores/config-store';
import { useProfileStore } from '@/stores/profile-store';
import { useUIStore } from '@/stores/ui-store';

export function SettingsPage() {
  const activeTab = useUIStore((s) => s.settingsTab) as SettingsTab;
  const setActiveTab = useUIStore((s) => s.setSettingsTab);
  const profile = useProfileStore((s) => s.profile);
  const refreshActiveProfile = useProfileStore((s) => s.refreshActiveProfile);
  const updateSystemPreferences = useProfileStore(
    (s) => s.updateSystemPreferences,
  );
  const updateUIPreferences = useProfileStore((s) => s.updateUIPreferences);
  const resetProfile = useProfileStore((s) => s.resetProfile);

  const config = useConfigStore((s) => s.config);
  const validation = useConfigStore((s) => s.validation);
  const hasGithubToken = useConfigStore((s) => s.hasGithubToken);
  const githubTokenValid = useConfigStore((s) => s.githubTokenValid);
  const openDataFolderDialog = useConfigStore((s) => s.openDataFolderDialog);
  const openExecutableDialog = useConfigStore((s) => s.openExecutableDialog);
  const saveConfig = useConfigStore((s) => s.saveConfig);
  const updateGithubToken = useConfigStore((s) => s.updateGithubToken);
  const clearGithubToken = useConfigStore((s) => s.clearGithubToken);
  const updateCheckForUpdatesOnLaunch = useConfigStore(
    (s) => s.updateCheckForUpdatesOnLaunch,
  );
  const clearConfig = useConfigStore((s) => s.clearConfig);

  useEffect(() => {
    void refreshActiveProfile().catch(() => {});
  }, [refreshActiveProfile]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-center">
          <Badge
            className="h-7 gap-1.5 border-[color-mix(in_srgb,var(--profiles-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--profiles-primary)_14%,transparent)] px-3 text-[var(--profiles-primary)]"
            aria-label={`Current profile: ${profile?.name ?? 'Loading profile'}`}
          >
            <CircleUser className="size-3.5" />
            <span className="max-w-[16rem] truncate font-semibold">
              {profile?.name ?? 'Loading profile'}
            </span>
          </Badge>
        </div>
        <PageHeading
          icon={Settings}
          title="Settings"
          description="Configure Railyard and customize your experience."
        />
      </div>

      <div className="relative z-[1] flex items-start gap-5">
        <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="min-w-0 flex-1">
          {activeTab === 'general' && (
            <GeneralSettingsPanel
              config={config}
              validation={validation}
              hasGithubToken={hasGithubToken}
              githubTokenValid={githubTokenValid}
              openDataFolderDialog={openDataFolderDialog}
              openExecutableDialog={openExecutableDialog}
              saveConfig={saveConfig}
              updateGithubToken={updateGithubToken}
              clearGithubToken={clearGithubToken}
              updateCheckForUpdatesOnLaunch={updateCheckForUpdatesOnLaunch}
            />
          )}
          {activeTab === 'ui' && (
            <UIPreferencesPanel
              profile={profile}
              onUpdateUIPreferences={updateUIPreferences}
            />
          )}
          {activeTab === 'system' && (
            <SystemPreferencesPanel
              profile={profile}
              onUpdateSystemPreferences={updateSystemPreferences}
            />
          )}
          {activeTab === 'danger' && (
            <DangerZonePanel
              onClearConfig={clearConfig}
              onResetProfile={resetProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}
