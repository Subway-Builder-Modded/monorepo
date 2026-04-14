import { RouteShellPage } from "@/app/components/pages/route-shell-page";
import { SiteShell } from "@/app/components/shell/site-shell";

export default function WebsiteSuitePage() {
  return (
    <SiteShell>
      <RouteShellPage title="Website" />
    </SiteShell>
  );
}
