import { SuiteOverviewPage } from "@/app/components/pages/suite-overview-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function WebsiteSuitePage() {
  return (
    <SiteShell>
      <SuiteOverviewPage
        suiteId="website"
        headline="Website Overview"
        blurb="Website suite pages coordinate design tokens, governance, and launch quality. The redesign foundation keeps old-site color fidelity while modernizing interaction polish."
      />
    </SiteShell>
  );
}
