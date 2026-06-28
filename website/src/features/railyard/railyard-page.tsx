import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { railyardDownloadOptions } from "@/features/railyard/railyard-downloads";
import { RailyardHero } from "@/features/railyard/components/railyard-hero";
import { RailyardAppStory } from "@/features/railyard/components/railyard-app-story";
import { RegistryDiscoveryPanel } from "@/features/railyard/components/registry-discovery-panel";
import { RailyardBridgeCards } from "@/features/railyard/components/railyard-bridge-cards";
import { RailyardDownloadsPicker } from "@/features/railyard/components/railyard-downloads-picker";
import type { RailyardRegistrySummary } from "@/features/railyard/railyard-types";

type RailyardPageProps = {
  summary: RailyardRegistrySummary;
  isSummaryLoading: boolean;
};

export function RailyardPage({ summary, isSummaryLoading }: RailyardPageProps) {
  const suite = getSuiteById("railyard");

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <RailyardHero summary={summary} isSummaryLoading={isSummaryLoading} />
      <RailyardAppStory />
      <RegistryDiscoveryPanel summary={summary} />
      <RailyardBridgeCards />
      <RailyardDownloadsPicker options={railyardDownloadOptions} />
    </SuiteAccentScope>
  );
}
