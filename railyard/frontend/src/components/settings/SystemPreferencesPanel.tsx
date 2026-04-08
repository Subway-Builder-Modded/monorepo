import { CircleFadingArrowUp, Database, Shield, Terminal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { SettingRow } from '@/components/settings/SettingRow';
import { SettingToggleButton } from '@/components/settings/SettingToggleButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useProfileStore } from '@/stores/profile-store';

import {
  GetPlatform,
  InstallLinuxSandbox,
  SandboxIsInstalled,
} from '../../../wailsjs/go/main/App';

export function SystemPreferencesPanel() {
  const profile = useProfileStore((s) => s.profile);
  const updateSystemPreferences = useProfileStore(
    (s) => s.updateSystemPreferences,
  );

  const [platform, setPlatform] = useState<string>('unknown');
  const [sandboxInstalled, setSandboxInstalled] = useState(false);

  useMemo(() => {
    GetPlatform().then((response) => {
      if (response.status === 'success')
        setPlatform(response.platform || 'unknown');
    });
  }, []);

  useMemo(() => {
    if (platform !== 'linux') return;
    SandboxIsInstalled().then((response) => {
      if (response.status === 'success')
        setSandboxInstalled(response.installed);
    });
  }, [platform]);

  const handleToggleRefreshRegistryOnStartup = async () => {
    if (!profile) return;
    const newValue = !profile.systemPreferences?.refreshRegistryOnStartup;
    try {
      await updateSystemPreferences({ refreshRegistryOnStartup: newValue });
      toast.success(
        `Refresh registry on startup ${newValue ? 'enabled' : 'disabled'}.`,
      );
    } catch {
      toast.error('Failed to update registry startup refresh setting.');
    }
  };

  const handleToggleAutoUpdateSubscriptions = async () => {
    if (!profile) return;
    const newValue = !profile.systemPreferences?.autoUpdateSubscriptions;
    try {
      await updateSystemPreferences({ autoUpdateSubscriptions: newValue });
      toast.success(
        `Auto-update subscriptions on startup ${newValue ? 'enabled' : 'disabled'}.`,
      );
    } catch {
      toast.error('Failed to update auto-update subscriptions setting.');
    }
  };

  const handleToggleDevTools = async () => {
    if (!profile) return;
    const newValue = !profile.systemPreferences?.useDevTools;
    try {
      await updateSystemPreferences({ useDevTools: newValue });
      toast.success(`Developer tools ${newValue ? 'enabled' : 'disabled'}.`);
    } catch {
      toast.error('Failed to update developer tools setting.');
    }
  };

  const handleInstallSandbox = async () => {
    try {
      const response = await InstallLinuxSandbox();
      if (response.status === 'error')
        throw new Error(response.message || 'Failed to install Linux sandbox');
      setSandboxInstalled(true);
      toast.success('Linux sandbox installed successfully.');
    } catch {
      toast.error(
        'Failed to install Linux sandbox. Check the logs for details.',
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Preferences</CardTitle>
        <CardDescription>
          Performance, update behavior, and developer options.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-0">
        <div className="divide-y divide-border">
          <SettingRow
            icon={<Database className="h-4 w-4" />}
            iconClassName="bg-[color-mix(in_oklab,var(--profiles-primary)_12%,transparent)] text-[var(--profiles-primary)]"
            label="Refresh Registry on Startup"
            description="Refresh the registry repository when Railyard starts"
            action={
              <SettingToggleButton
                enabled={!!profile?.systemPreferences?.refreshRegistryOnStartup}
                onToggle={handleToggleRefreshRegistryOnStartup}
                enabledLabel="Enabled"
                disabledLabel="Disabled"
              />
            }
          />
          <SettingRow
            icon={<CircleFadingArrowUp className="h-4 w-4" />}
            iconClassName="bg-[color-mix(in_oklab,var(--update-primary)_12%,transparent)] text-[var(--update-primary)]"
            label="Auto Update Subscriptions"
            description="Automatically update subscribed assets to latest after startup sync"
            action={
              <SettingToggleButton
                enabled={!!profile?.systemPreferences?.autoUpdateSubscriptions}
                onToggle={handleToggleAutoUpdateSubscriptions}
                enabledLabel="Enabled"
                disabledLabel="Disabled"
              />
            }
          />
          <SettingRow
            icon={<Terminal className="h-4 w-4" />}
            label="Developer Tools"
            description="Enable Chromium DevTools for inspecting the app interface"
            action={
              <SettingToggleButton
                enabled={!!profile?.systemPreferences?.useDevTools}
                onToggle={handleToggleDevTools}
                enabledLabel="Enabled"
                disabledLabel="Disabled"
              />
            }
          />
          {platform === 'linux' && (
            <SettingRow
              icon={<Shield className="h-4 w-4" />}
              iconClassName="bg-[color-mix(in_oklab,var(--install-primary)_12%,transparent)] text-[var(--install-primary)]"
              label="Linux Sandbox"
              badge={
                <Badge
                  size="sm"
                  variant={sandboxInstalled ? 'success' : 'outline'}
                >
                  {sandboxInstalled ? 'Installed' : 'Not Installed'}
                </Badge>
              }
              description="Improves mod compatibility and security on Linux"
              action={
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleInstallSandbox}
                  disabled={sandboxInstalled}
                >
                  Install
                </Button>
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
