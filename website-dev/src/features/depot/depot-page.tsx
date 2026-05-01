import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { DepotMapForgeHero } from "@/features/depot/components/depot-map-forge-hero";

export function DepotPage() {
  const suite = getSuiteById("depot");

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <DepotMapForgeHero />
    </SuiteAccentScope>
  );
}
