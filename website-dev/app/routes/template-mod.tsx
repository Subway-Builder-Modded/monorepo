import { SuiteOverviewPage } from "@/app/components/pages/suite-overview-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function TemplateModPage() {
  return (
    <SiteShell>
      <SuiteOverviewPage
        suiteId="template-mod"
        headline="Template Mod Overview"
        blurb="Template Mod provides the fastest path to production-safe mod templates. This page validates suite accents, shared navigation structures, and reusable shell composition."
      />
    </SiteShell>
  );
}
