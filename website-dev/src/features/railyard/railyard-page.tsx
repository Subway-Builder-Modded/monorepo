import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { railyardDownloadOptions } from "@/features/railyard/railyard-downloads";
import { RailyardHero } from "@/features/railyard/components/RailyardHero";
import { RailyardAppStory } from "@/features/railyard/components/RailyardAppStory";
import { RegistryDiscoveryPanel } from "@/features/railyard/components/RegistryDiscoveryPanel";
import { RailyardBridgeCards } from "@/features/railyard/components/RailyardBridgeCards";
import { RailyardDownloadsPicker } from "@/features/railyard/components/RailyardDownloadsPicker";
import type { RailyardRegistrySummary } from "@/features/railyard/railyard-types";

type RailyardPageProps = {
  summary: RailyardRegistrySummary;
};

export function RailyardPage({ summary }: RailyardPageProps) {
  const suite = getSuiteById("railyard");

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <RailyardHero summary={summary} />
      <RailyardAppStory />
      <RegistryDiscoveryPanel summary={summary} />
      <RailyardBridgeCards />
      <RailyardDownloadsPicker options={railyardDownloadOptions} />
    </SuiteAccentScope>
  );
}
