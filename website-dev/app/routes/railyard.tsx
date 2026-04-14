import { SuiteOverviewPage } from "@/app/components/pages/suite-overview-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function RailyardPage() {
  return (
    <SiteShell>
      <SuiteOverviewPage
        suiteId="railyard"
        headline="Railyard Overview"
        blurb="Railyard is the release and distribution line for Subway Builder Modded. This redesigned page demonstrates route-aware shell behavior, accent-correct theme tokens, and polished card hierarchy."
      />
    </SiteShell>
  );
}
