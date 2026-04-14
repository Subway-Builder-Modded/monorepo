import { SuiteOverviewPage } from "@/app/components/pages/suite-overview-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function RegistryPage() {
  return (
    <SiteShell>
      <SuiteOverviewPage
        suiteId="registry"
        headline="Registry Overview"
        blurb="Registry tracks ecosystem intelligence and package metadata. The layout keeps transit-grade navigation clarity while staying lightweight and maintainable."
      />
    </SiteShell>
  );
}
