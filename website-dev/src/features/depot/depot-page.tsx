import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { DepotFinalCta } from "@/features/depot/components/depot-final-cta";
import { DepotMapForgeHero } from "@/features/depot/components/depot-map-forge-hero";
import { DepotOperationsSection } from "@/features/depot/components/depot-operations-section";
import { DepotScrollytellingSection } from "@/features/depot/components/depot-scrollytelling";

export function DepotPage() {
  const suite = getSuiteById("depot");

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <DepotMapForgeHero />
      <DepotScrollytellingSection />
      <DepotOperationsSection />
      <DepotFinalCta />
    </SuiteAccentScope>
  );
}
